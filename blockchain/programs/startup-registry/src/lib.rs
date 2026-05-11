use anchor_lang::prelude::*;

declare_id!("7caediXMm5C4vNg2yLD9rD176x7kAS7JBU3d2zigKFvw");

// Certificate Registry Program ID (for on-chain verification)
use anchor_lang::solana_program::pubkey;
const CERTIFICATE_REGISTRY_PROGRAM_ID: Pubkey =
    pubkey!("D7SYneSxju3iTtJW9HPQMVjQRXgTCZi2vR2UWRk8nTRa");

#[program]
pub mod startup_registry {
    use super::*;

    /// Registers a new startup
    pub fn register_startup(
        ctx: Context<RegisterStartup>,
        startup_id: String,
        name: String,
        sector: String,
    ) -> Result<()> {
        let startup = &mut ctx.accounts.startup;
        let clock = Clock::get()?;

        startup.startup_id = startup_id;
        startup.name = name;
        startup.sector = sector;
        startup.founder_address = ctx.accounts.founder.key();
        startup.employee_addresses = Vec::new();
        startup.registration_timestamp = clock.unix_timestamp;

        msg!("Startup registered: {}", startup.startup_id);
        Ok(())
    }

    /// Adds an employee with verified certificate to startup
    /// Verifies certificate exists on-chain before adding
    pub fn add_employee(ctx: Context<AddEmployee>, certificate_id: String) -> Result<()> {
        let startup = &mut ctx.accounts.startup;

        // On-chain verification: Check certificate account exists and is valid
        // Anchor's account constraint above already verifies:
        // 1. Account exists (via PDA seeds)
        // 2. Account is owned by Certificate Registry Program (via seeds::program)
        // 3. Account data structure matches CertificateAccount

        let certificate = &ctx.accounts.certificate;

        // Verify certificate_id matches
        require!(
            certificate.certificate_id == certificate_id,
            ErrorCode::InvalidCertificate
        );

        // Verify certificate has valid data
        require!(
            certificate.certificate_id.len() > 0,
            ErrorCode::InvalidCertificate
        );

        msg!(
            "Certificate verified on-chain: {} for student: {}",
            certificate_id,
            certificate.student_name
        );

        // Check if employee already exists
        if !startup.employee_addresses.contains(&certificate_id) {
            let cert_id_clone = certificate_id.clone();
            startup.employee_addresses.push(certificate_id);
            msg!(
                "Employee with verified certificate added to startup: {}",
                cert_id_clone
            );
        } else {
            return Err(ErrorCode::EmployeeExists.into());
        }

        Ok(())
    }

    /// Gets startup profile with employee list
    pub fn get_startup_profile(ctx: Context<GetStartupProfile>) -> Result<()> {
        let startup = &ctx.accounts.startup;
        msg!("Startup ID: {}", startup.startup_id);
        msg!("Name: {}", startup.name);
        msg!("Sector: {}", startup.sector);
        msg!("Employees: {}", startup.employee_addresses.len());
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(startup_id: String)]
pub struct RegisterStartup<'info> {
    #[account(
        init,
        payer = founder,
        space = 8 + 4 + 100 + 4 + 100 + 4 + 100 + 32 + 4 + (4 + 100) * 10 + 8,
        seeds = [b"startup", startup_id.as_bytes()],
        bump
    )]
    pub startup: Account<'info, Startup>,
    #[account(mut)]
    pub founder: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(certificate_id: String)]
pub struct AddEmployee<'info> {
    #[account(mut)]
    pub startup: Account<'info, Startup>,
    pub employee: Signer<'info>,
    /// Certificate account from Certificate Registry - verified on-chain
    /// PDA: [b"certificate", certificate_id.as_bytes()]
    /// Must be owned by Certificate Registry Program
    #[account(
        seeds = [b"certificate", certificate_id.as_bytes()],
        bump,
        seeds::program = CERTIFICATE_REGISTRY_PROGRAM_ID
    )]
    pub certificate: Account<'info, CertificateAccount>,
}

// Import Certificate struct from certificate-registry
#[account]
pub struct CertificateAccount {
    pub certificate_id: String,
    pub student_name: String,
    pub degree: String,
    pub university: String,
    pub graduation_date: String,
    pub certificate_hash: String,
    pub issue_timestamp: i64,
    pub authority: Pubkey,
}

#[derive(Accounts)]
pub struct GetStartupProfile<'info> {
    pub startup: Account<'info, Startup>,
}

#[account]
pub struct Startup {
    pub startup_id: String,
    pub name: String,
    pub sector: String,
    pub founder_address: Pubkey,
    pub employee_addresses: Vec<String>,
    pub registration_timestamp: i64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid startup")]
    InvalidStartup,
    #[msg("Employee already exists")]
    EmployeeExists,
    #[msg("Invalid certificate - certificate not found or invalid")]
    InvalidCertificate,
}
