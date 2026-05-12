use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("c9ieYuJCWPuj1uhEN4VzNSQj68GHN1qw6tNvmsb7Eed");

/// ALWARD Milestone Escrow Protocol
/// ─────────────────────────────────────────────────────────────────────────
/// Flow:
///   1. Startup onboards → FounderEscrowConfig created (stores milestone count)
///   2. Investor calls `invest_in_escrow` → USDC transferred from investor ATA
///      to escrow PDA vault. Immutable on-chain record created.
///   3. TRIPLE APPROVAL REQUIRED FOR MILESTONE VALIDATION:
///      a) `agent_approve_milestone`
///      b) `alward_approve_milestone`
///      c) `investor_approve_milestone`
///   4. Anyone calls `release_tranche` → proportional USDC released from vault
///      to founder's ATA. Permissionless once milestone is validated (all 3 approved).
///   5. Investor calls `refund` if startup is abandoned (all milestones expired).
/// ─────────────────────────────────────────────────────────────────────────

#[program]
pub mod milestone_escrow {
    use super::*;

    pub fn initialize_founder_config(
        ctx: Context<InitializeFounderConfig>,
        startup_id: String,
        milestone_count: u8,
        funding_goal_usdc: u64,
    ) -> Result<()> {
        require!(milestone_count > 0 && milestone_count <= 10, AlwardError::InvalidMilestoneCount);
        require!(funding_goal_usdc > 0, AlwardError::InvalidAmount);

        let config = &mut ctx.accounts.founder_config;
        config.startup_id = startup_id.clone();
        config.founder = ctx.accounts.founder.key();
        config.usdc_mint = ctx.accounts.usdc_mint.key();
        config.milestone_count = milestone_count;
        config.milestones_validated = 0;
        config.funding_goal_usdc = funding_goal_usdc;
        config.total_invested = 0;
        config.total_released = 0;
        config.bump = ctx.bumps.founder_config;

        emit!(FounderConfigCreated {
            startup_id,
            founder: ctx.accounts.founder.key(),
            milestone_count,
            funding_goal_usdc,
        });

        Ok(())
    }

    pub fn invest_in_escrow(
        ctx: Context<InvestInEscrow>,
        startup_id: String,
        investment_id: String,
        amount_usdc: u64,
    ) -> Result<()> {
        require!(amount_usdc > 0, AlwardError::InvalidAmount);

        let config = &mut ctx.accounts.founder_config;

        let cpi_accounts = Transfer {
            from: ctx.accounts.investor_token_account.to_account_info(),
            to: ctx.accounts.escrow_vault.to_account_info(),
            authority: ctx.accounts.investor.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
        token::transfer(cpi_ctx, amount_usdc)?;

        let record = &mut ctx.accounts.investment_record;
        let clock = Clock::get()?;
        record.investment_id = investment_id.clone();
        record.startup_id = startup_id.clone();
        record.investor = ctx.accounts.investor.key();
        record.amount_usdc = amount_usdc;
        record.timestamp = clock.unix_timestamp;
        record.status = InvestmentStatus::Active;
        record.bump = ctx.bumps.investment_record;

        config.total_invested = config.total_invested.checked_add(amount_usdc)
            .ok_or(AlwardError::Overflow)?;

        emit!(InvestmentRecorded {
            investment_id,
            startup_id,
            investor: ctx.accounts.investor.key(),
            amount_usdc,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    // ──────────────────────────────────────────────────────
    // INSTRUCTION 3a: Ground agent approves
    // ──────────────────────────────────────────────────────
    pub fn agent_approve_milestone(
        ctx: Context<AgentApproveMilestone>,
        startup_id: String,
        milestone_index: u8,
        confidence_score: u8,
        evidence_hash: String,
    ) -> Result<()> {
        let config = &mut ctx.accounts.founder_config;
        require!(milestone_index < config.milestone_count, AlwardError::InvalidMilestoneIndex);
        require!(confidence_score <= 100, AlwardError::InvalidConfidenceScore);

        let milestone = &mut ctx.accounts.milestone_record;
        require!(milestone.status != MilestoneStatus::Validated, AlwardError::MilestoneAlreadyValidated);

        if milestone.startup_id.is_empty() {
            milestone.startup_id = startup_id.clone();
            milestone.milestone_index = milestone_index;
            milestone.status = MilestoneStatus::Pending;
        }

        milestone.agent = ctx.accounts.ground_agent.key();
        milestone.confidence_score = confidence_score;
        milestone.evidence_hash = evidence_hash;
        milestone.agent_approved = true;
        milestone.bump = ctx.bumps.milestone_record;

        check_and_validate_milestone(milestone, config)?;
        Ok(())
    }

    // ──────────────────────────────────────────────────────
    // INSTRUCTION 3b: Alward Platform approves
    // ──────────────────────────────────────────────────────
    pub fn alward_approve_milestone(
        ctx: Context<AlwardApproveMilestone>,
        startup_id: String,
        milestone_index: u8,
    ) -> Result<()> {
        let config = &mut ctx.accounts.founder_config;
        let milestone = &mut ctx.accounts.milestone_record;
        require!(milestone_index < config.milestone_count, AlwardError::InvalidMilestoneIndex);
        require!(milestone.status != MilestoneStatus::Validated, AlwardError::MilestoneAlreadyValidated);

        if milestone.startup_id.is_empty() {
            milestone.startup_id = startup_id.clone();
            milestone.milestone_index = milestone_index;
            milestone.status = MilestoneStatus::Pending;
        }

        milestone.alward_approved = true;
        milestone.bump = ctx.bumps.milestone_record;

        check_and_validate_milestone(milestone, config)?;
        Ok(())
    }

    // ──────────────────────────────────────────────────────
    // INSTRUCTION 3c: Investor approves
    // ──────────────────────────────────────────────────────
    pub fn investor_approve_milestone(
        ctx: Context<InvestorApproveMilestone>,
        startup_id: String,
        milestone_index: u8,
    ) -> Result<()> {
        let config = &mut ctx.accounts.founder_config;
        let milestone = &mut ctx.accounts.milestone_record;
        let record = &ctx.accounts.investment_record;

        require!(milestone_index < config.milestone_count, AlwardError::InvalidMilestoneIndex);
        require!(record.startup_id == startup_id, AlwardError::InvalidStartup);
        require!(record.investor == ctx.accounts.investor.key(), AlwardError::Unauthorized);
        require!(record.status == InvestmentStatus::Active, AlwardError::Unauthorized);
        require!(milestone.status != MilestoneStatus::Validated, AlwardError::MilestoneAlreadyValidated);

        if milestone.startup_id.is_empty() {
            milestone.startup_id = startup_id.clone();
            milestone.milestone_index = milestone_index;
            milestone.status = MilestoneStatus::Pending;
        }

        milestone.investor_approved = true;
        milestone.bump = ctx.bumps.milestone_record;

        check_and_validate_milestone(milestone, config)?;
        Ok(())
    }

    pub fn release_tranche(
        ctx: Context<ReleaseTranche>,
        startup_id: String,
        milestone_index: u8,
    ) -> Result<()> {
        let milestone = &mut ctx.accounts.milestone_record;
        require!(
            milestone.status == MilestoneStatus::Validated,
            AlwardError::MilestoneNotValidated
        );
        require!(
            !milestone.tranche_released,
            AlwardError::TrancheAlreadyReleased
        );

        let config = &ctx.accounts.founder_config;
        let tranche_amount = config.total_invested
            .checked_div(config.milestone_count as u64)
            .ok_or(AlwardError::DivisionByZero)?;

        let startup_id_bytes = startup_id.as_bytes();
        let seeds = &[
            b"escrow_vault",
            startup_id_bytes,
            &[ctx.accounts.founder_config.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_vault.to_account_info(),
            to: ctx.accounts.founder_token_account.to_account_info(),
            authority: ctx.accounts.founder_config.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer_seeds,
        );
        token::transfer(cpi_ctx, tranche_amount)?;

        milestone.tranche_released = true;

        emit!(TrancheReleased {
            startup_id,
            milestone_index,
            amount_usdc: tranche_amount,
            founder: ctx.accounts.founder_config.founder,
        });

        Ok(())
    }

    pub fn refund_investor(
        ctx: Context<RefundInvestor>,
        startup_id: String,
    ) -> Result<()> {
        let record = &mut ctx.accounts.investment_record;
        require!(record.status == InvestmentStatus::Active, AlwardError::NotRefundable);

        let config = &ctx.accounts.founder_config;
        require!(config.milestones_validated == 0, AlwardError::RefundNotAllowed);

        let startup_id_bytes = startup_id.as_bytes();
        let seeds = &[
            b"escrow_vault",
            startup_id_bytes,
            &[config.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_vault.to_account_info(),
            to: ctx.accounts.investor_token_account.to_account_info(),
            authority: ctx.accounts.founder_config.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer_seeds,
        );
        token::transfer(cpi_ctx, record.amount_usdc)?;

        record.status = InvestmentStatus::Refunded;

        emit!(InvestorRefunded {
            startup_id,
            investor: record.investor,
            amount_usdc: record.amount_usdc,
        });

        Ok(())
    }
}

fn check_and_validate_milestone(milestone: &mut Account<MilestoneRecord>, config: &mut Account<FounderEscrowConfig>) -> Result<()> {
    if milestone.agent_approved && milestone.alward_approved && milestone.investor_approved && milestone.status != MilestoneStatus::Validated {
        let clock = Clock::get()?;
        milestone.validated_at = clock.unix_timestamp;
        milestone.status = MilestoneStatus::Validated;
        config.milestones_validated = config.milestones_validated.checked_add(1).ok_or(AlwardError::Overflow)?;
        
        emit!(MilestoneValidated {
            startup_id: milestone.startup_id.clone(),
            milestone_index: milestone.milestone_index,
            validated_at: milestone.validated_at,
        });
    }
    Ok(())
}

// ──────────────────────────────────────────────────────
// ACCOUNT CONTEXTS
// ──────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(startup_id: String)]
pub struct InitializeFounderConfig<'info> {
    #[account(
        init,
        payer = founder,
        space = FounderEscrowConfig::SIZE,
        seeds = [b"founder_config", startup_id.as_bytes()],
        bump
    )]
    pub founder_config: Account<'info, FounderEscrowConfig>,
    #[account(mut)]
    pub founder: Signer<'info>,
    /// CHECK: USDC mint address
    pub usdc_mint: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(startup_id: String, investment_id: String)]
pub struct InvestInEscrow<'info> {
    #[account(mut, seeds = [b"founder_config", startup_id.as_bytes()], bump = founder_config.bump)]
    pub founder_config: Account<'info, FounderEscrowConfig>,
    #[account(
        init,
        payer = investor,
        space = InvestmentRecord::SIZE,
        seeds = [b"investment", investment_id.as_bytes()],
        bump
    )]
    pub investment_record: Account<'info, InvestmentRecord>,
    #[account(
        init_if_needed,
        payer = investor,
        seeds = [b"escrow_vault", startup_id.as_bytes()],
        bump,
        token::mint = founder_config.usdc_mint,
        token::authority = founder_config,
    )]
    pub escrow_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub investor: Signer<'info>,
    #[account(mut, token::mint = founder_config.usdc_mint, token::authority = investor)]
    pub investor_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(startup_id: String, milestone_index: u8)]
pub struct AgentApproveMilestone<'info> {
    #[account(mut, seeds = [b"founder_config", startup_id.as_bytes()], bump = founder_config.bump)]
    pub founder_config: Account<'info, FounderEscrowConfig>,
    #[account(
        init_if_needed,
        payer = ground_agent,
        space = MilestoneRecord::SIZE,
        seeds = [b"milestone", startup_id.as_bytes(), &[milestone_index]],
        bump
    )]
    pub milestone_record: Account<'info, MilestoneRecord>,
    #[account(mut)]
    pub ground_agent: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(startup_id: String, milestone_index: u8)]
pub struct AlwardApproveMilestone<'info> {
    #[account(mut, seeds = [b"founder_config", startup_id.as_bytes()], bump = founder_config.bump)]
    pub founder_config: Account<'info, FounderEscrowConfig>,
    #[account(
        init_if_needed,
        payer = alward_admin,
        space = MilestoneRecord::SIZE,
        seeds = [b"milestone", startup_id.as_bytes(), &[milestone_index]],
        bump
    )]
    pub milestone_record: Account<'info, MilestoneRecord>,
    #[account(mut)]
    pub alward_admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(startup_id: String, milestone_index: u8)]
pub struct InvestorApproveMilestone<'info> {
    #[account(mut, seeds = [b"founder_config", startup_id.as_bytes()], bump = founder_config.bump)]
    pub founder_config: Account<'info, FounderEscrowConfig>,
    #[account(
        init_if_needed,
        payer = investor,
        space = MilestoneRecord::SIZE,
        seeds = [b"milestone", startup_id.as_bytes(), &[milestone_index]],
        bump
    )]
    pub milestone_record: Account<'info, MilestoneRecord>,
    #[account(mut)]
    pub investment_record: Account<'info, InvestmentRecord>,
    #[account(mut)]
    pub investor: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(startup_id: String, milestone_index: u8)]
pub struct ReleaseTranche<'info> {
    #[account(mut, seeds = [b"founder_config", startup_id.as_bytes()], bump = founder_config.bump)]
    pub founder_config: Account<'info, FounderEscrowConfig>,
    #[account(mut, seeds = [b"milestone", startup_id.as_bytes(), &[milestone_index]], bump = milestone_record.bump)]
    pub milestone_record: Account<'info, MilestoneRecord>,
    #[account(
        mut,
        seeds = [b"escrow_vault", startup_id.as_bytes()],
        bump,
        token::mint = founder_config.usdc_mint,
        token::authority = founder_config,
    )]
    pub escrow_vault: Account<'info, TokenAccount>,
    #[account(mut, token::mint = founder_config.usdc_mint, token::authority = founder_config.founder)]
    pub founder_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(startup_id: String)]
pub struct RefundInvestor<'info> {
    #[account(seeds = [b"founder_config", startup_id.as_bytes()], bump = founder_config.bump)]
    pub founder_config: Account<'info, FounderEscrowConfig>,
    #[account(mut)]
    pub investment_record: Account<'info, InvestmentRecord>,
    #[account(
        mut,
        seeds = [b"escrow_vault", startup_id.as_bytes()],
        bump,
        token::mint = founder_config.usdc_mint,
        token::authority = founder_config,
    )]
    pub escrow_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub investor: Signer<'info>,
    #[account(mut, token::mint = founder_config.usdc_mint, token::authority = investor)]
    pub investor_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

// ──────────────────────────────────────────────────────
// STATE ACCOUNTS
// ──────────────────────────────────────────────────────

#[account]
pub struct FounderEscrowConfig {
    pub startup_id: String,          
    pub founder: Pubkey,
    pub usdc_mint: Pubkey,
    pub milestone_count: u8,
    pub milestones_validated: u8,
    pub funding_goal_usdc: u64,
    pub total_invested: u64,
    pub total_released: u64,
    pub bump: u8,
}

impl FounderEscrowConfig {
    pub const SIZE: usize = 8       // discriminator
        + 4 + 50                    // startup_id
        + 32                        // founder
        + 32                        // usdc_mint
        + 1                         // milestone_count
        + 1                         // milestones_validated
        + 8                         // funding_goal_usdc
        + 8                         // total_invested
        + 8                         // total_released
        + 1;                        // bump
}

#[account]
pub struct InvestmentRecord {
    pub investment_id: String,       // max 30 chars
    pub startup_id: String,          // max 50 chars
    pub investor: Pubkey,
    pub amount_usdc: u64,
    pub timestamp: i64,
    pub status: InvestmentStatus,
    pub bump: u8,
}

impl InvestmentRecord {
    pub const SIZE: usize = 8       // discriminator
        + 4 + 30                    // investment_id
        + 4 + 50                    // startup_id
        + 32                        // investor
        + 8                         // amount_usdc
        + 8                         // timestamp
        + 1                         // status
        + 1;                        // bump
}

#[account]
pub struct MilestoneRecord {
    pub startup_id: String,          // max 50 chars
    pub milestone_index: u8,
    pub agent: Pubkey,
    pub confidence_score: u8,
    pub evidence_hash: String,       // max 80 chars
    pub agent_approved: bool,
    pub alward_approved: bool,
    pub investor_approved: bool,
    pub validated_at: i64,
    pub status: MilestoneStatus,
    pub tranche_released: bool,
    pub bump: u8,
}

impl MilestoneRecord {
    pub const SIZE: usize = 8       // discriminator
        + 4 + 50                    // startup_id
        + 1                         // milestone_index
        + 32                        // agent
        + 1                         // confidence_score
        + 4 + 80                    // evidence_hash
        + 1                         // agent_approved
        + 1                         // alward_approved
        + 1                         // investor_approved
        + 8                         // validated_at
        + 1                         // status
        + 1                         // tranche_released
        + 1;                        // bump
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum InvestmentStatus {
    Active,
    Refunded,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum MilestoneStatus {
    Pending,
    Validated,
}

#[event]
pub struct FounderConfigCreated {
    pub startup_id: String,
    pub founder: Pubkey,
    pub milestone_count: u8,
    pub funding_goal_usdc: u64,
}

#[event]
pub struct InvestmentRecorded {
    pub investment_id: String,
    pub startup_id: String,
    pub investor: Pubkey,
    pub amount_usdc: u64,
    pub timestamp: i64,
}

#[event]
pub struct MilestoneValidated {
    pub startup_id: String,
    pub milestone_index: u8,
    pub validated_at: i64,
}

#[event]
pub struct TrancheReleased {
    pub startup_id: String,
    pub milestone_index: u8,
    pub amount_usdc: u64,
    pub founder: Pubkey,
}

#[event]
pub struct InvestorRefunded {
    pub startup_id: String,
    pub investor: Pubkey,
    pub amount_usdc: u64,
}

#[error_code]
pub enum AlwardError {
    #[msg("Milestone count must be between 1 and 10")]
    InvalidMilestoneCount,
    #[msg("Amount must be greater than zero")]
    InvalidAmount,
    #[msg("Milestone index out of range")]
    InvalidMilestoneIndex,
    #[msg("Confidence score must be 0-100")]
    InvalidConfidenceScore,
    #[msg("Milestone already validated")]
    MilestoneAlreadyValidated,
    #[msg("Milestone not yet validated by all three parties")]
    MilestoneNotValidated,
    #[msg("Tranche already released for this milestone")]
    TrancheAlreadyReleased,
    #[msg("Investment is not eligible for refund")]
    NotRefundable,
    #[msg("Refund not allowed — milestones already in progress")]
    RefundNotAllowed,
    #[msg("Invalid startup")]
    InvalidStartup,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Division by zero")]
    DivisionByZero,
}
