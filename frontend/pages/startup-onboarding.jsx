/**
 * Startup Onboarding Page
 * Complete profile creation form with business information, funding goals, and pitch deck
 */
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../contexts/AuthContext";
import { startupAPI } from "../lib/api";
import {
  Building2,
  DollarSign,
  FileText,
  Upload,
  CheckCircle,
  Loader,
} from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

const INDUSTRIES = [
  "Technology",
  "Healthcare",
  "Agriculture",
  "Education",
  "Finance",
  "Tourism",
  "Construction",
  "Other",
];

export default function StartupOnboarding() {
  const router = useRouter();
  const { isAuthenticated, user, refetchCapabilities } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Basic Information
    name: "",
    sector: "",
    country: "Sierra Leone",
    year_founded: new Date().getFullYear(),

    // Business Details
    website: "",
    contact_email: "",
    phone: "",
    address: "",

    // Mission & Vision
    mission: "",
    vision: "",
    description: "",
    products_services: "",

    // Funding
    funding_goal: "",
    pitch_deck_url: "",

    // Team
    team_size: "",
    founder_experience_years: "",
  });

  const [errors, setErrors] = useState({});
  const [verificationStatus, setVerificationStatus] = useState("pending");

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    // Load existing startup data if editing
    fetchExistingStartup();
  }, [isAuthenticated, router, user]);

  const fetchExistingStartup = async () => {
    if (!user?.id) return;
    
    try {
      const response = await startupAPI.getByFounder(user.id);
      
      const data = response.data;
      // Preload all form data from existing startup
      setFormData({
        name: data.name || "",
        sector: data.sector || "",
        country: data.country || "Sierra Leone",
        year_founded: data.year_founded || new Date().getFullYear(),
        website: data.website || "",
        contact_email: data.contact_email || "",
        phone: data.phone || "",
        address: data.address || "",
        mission: data.mission || "",
        vision: data.vision || "",
        description: data.description || "",
        products_services: data.products_services || "",
        funding_goal: data.funding_goal ? data.funding_goal.toString() : "",
        pitch_deck_url: data.pitch_deck_url || "",
        team_size: data.team_size ? data.team_size.toString() : "",
        founder_experience_years: data.founder_experience_years ? data.founder_experience_years.toString() : "",
      });
      
      toast.success("Loaded existing startup data. You can edit and save changes.");
    } catch (error) {
      if (error.response && error.response.status !== 404) {
        // 404 is expected for new startups, other errors should be logged
        console.error("Failed to fetch startup data:", error.response.status);
      } else {
        // Silent fail - new startup creation flow
        console.log("No existing startup found, creating new one...");
      }
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = "Startup name is required";
      if (!formData.sector) newErrors.sector = "Industry sector is required";
      if (!formData.description.trim())
        newErrors.description = "Description is required";
    }

    if (step === 2) {
      if (!formData.contact_email.trim())
        newErrors.contact_email = "Email is required";
      if (!formData.phone.trim()) newErrors.phone = "Phone is required";
      if (!formData.address.trim()) newErrors.address = "Address is required";
    }

    if (step === 3) {
      if (!formData.mission.trim()) newErrors.mission = "Mission is required";
      if (!formData.vision.trim()) newErrors.vision = "Vision is required";
      if (!formData.products_services.trim())
        newErrors.products_services = "Products/Services is required";
    }

    if (step === 4) {
      if (!formData.funding_goal || parseFloat(formData.funding_goal) <= 0) {
        newErrors.funding_goal = "Valid funding goal is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setLoading(true);
    try {
      // Register startup (wallet address is managed via profile settings, not onboarding)
      const response = await startupAPI.register({
        ...formData,
        funding_goal: parseFloat(formData.funding_goal),
        team_size: parseInt(formData.team_size) || 1,
        founder_experience_years: parseInt(formData.founder_experience_years) || null,
        wallet_address: user?.wallet_address || null,
      });

      const data = response.data;

      await refetchCapabilities?.();
      if (data.already_exists) {
        toast.success("Redirecting to startup marketplace...");
        router.push("/startup-marketplace");
      } else {
        toast.success("Startup profile submitted! Awaiting admin verification.");
        setVerificationStatus("pending");
        router.push("/startup-marketplace");
      }
    } catch (error) {
      const errorData = error.response?.data;
      // If error indicates startup already exists, redirect to dashboard
      if (
        errorData?.detail &&
        errorData.detail.includes("already have a registered startup")
      ) {
        toast("You already have a startup. Redirecting to dashboard...", { icon: 'ℹ️' });
        router.push("/startup-dashboard");
      } else {
        let msg = "An error occurred. Please try again.";
        if (errorData?.detail) {
          msg = typeof errorData.detail === 'string' 
            ? errorData.detail 
            : Array.isArray(errorData.detail) 
              ? errorData.detail.map(e => e.msg || JSON.stringify(e)).join(', ')
              : JSON.stringify(errorData.detail);
        }
        toast.error(msg);
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: "Basic Info", icon: Building2 },
    { number: 2, title: "Contact", icon: FileText },
    { number: 3, title: "Mission", icon: CheckCircle },
    { number: 4, title: "Funding", icon: DollarSign },
  ];

  if (!isAuthenticated) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 mb-8 shadow-xl"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            Startup Onboarding
          </h1>
          <p className="text-white/80">
            Create your startup profile and start raising funds
          </p>
        </motion.div>

        {/* Progress Steps */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 mb-8">
          <div className="flex justify-between items-center">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                      currentStep >= step.number
                        ? "bg-blue-500 border-blue-500 text-white"
                        : "bg-white/10 border-white/20 text-white/60"
                    }`}
                  >
                    {currentStep > step.number ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <step.icon className="w-6 h-6" />
                    )}
                  </div>
                  <span className="mt-2 text-sm text-white/80">
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 ${
                      currentStep > step.number ? "bg-blue-500" : "bg-white/20"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 shadow-xl"
        >
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">
                Basic Information
              </h2>

              <div>
                <label className="block text-white/80 mb-2">
                  Startup Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Enter your startup name"
                />
                {errors.name && (
                  <p className="text-red-400 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-white/80 mb-2">
                  Industry Sector *
                </label>
                <select
                  value={formData.sector}
                  onChange={(e) =>
                    setFormData({ ...formData, sector: e.target.value })
                  }
                  className="w-full px-4 py-3 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="" className="bg-gray-900">
                    Select industry
                  </option>
                  {INDUSTRIES.map((industry) => (
                    <option
                      key={industry}
                      value={industry}
                      className="bg-gray-900"
                    >
                      {industry}
                    </option>
                  ))}
                </select>
                {errors.sector && (
                  <p className="text-red-400 text-sm mt-1">{errors.sector}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/80 mb-2">Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) =>
                      setFormData({ ...formData, country: e.target.value })
                    }
                    className="w-full px-4 py-3 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-white/80 mb-2">
                    Year Founded
                  </label>
                  <input
                    type="number"
                    value={formData.year_founded}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        year_founded: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-3 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/80 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={5}
                  className="w-full px-4 py-3 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Describe your startup..."
                />
                {errors.description && (
                  <p className="text-red-400 text-sm mt-1">
                    {errors.description}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Contact Information */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">
                Contact Information
              </h2>

              <div>
                <label className="block text-white/80 mb-2">
                  Contact Email *
                </label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) =>
                    setFormData({ ...formData, contact_email: e.target.value })
                  }
                  className="w-full px-4 py-3 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="contact@startup.com"
                />
                {errors.contact_email && (
                  <p className="text-red-400 text-sm mt-1">
                    {errors.contact_email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-white/80 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-4 py-3 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="+232 76 123 456"
                />
                {errors.phone && (
                  <p className="text-red-400 text-sm mt-1">{errors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-white/80 mb-2">Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                  className="w-full px-4 py-3 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="https://yourstartup.com"
                />
              </div>

              <div>
                <label className="block text-white/80 mb-2">Address *</label>
                <textarea
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-3 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Street address, City, Country"
                />
                {errors.address && (
                  <p className="text-red-400 text-sm mt-1">{errors.address}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Mission & Vision */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">
                Mission & Vision
              </h2>

              <div>
                <label className="block text-white/80 mb-2">
                  Mission Statement *
                </label>
                <textarea
                  value={formData.mission}
                  onChange={(e) =>
                    setFormData({ ...formData, mission: e.target.value })
                  }
                  rows={4}
                  className="w-full px-4 py-3 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="What is your startup's mission?"
                />
                {errors.mission && (
                  <p className="text-red-400 text-sm mt-1">{errors.mission}</p>
                )}
              </div>

              <div>
                <label className="block text-white/80 mb-2">
                  Vision Statement *
                </label>
                <textarea
                  value={formData.vision}
                  onChange={(e) =>
                    setFormData({ ...formData, vision: e.target.value })
                  }
                  rows={4}
                  className="w-full px-4 py-3 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="What is your startup's vision for the future?"
                />
                {errors.vision && (
                  <p className="text-red-400 text-sm mt-1">{errors.vision}</p>
                )}
              </div>

              <div>
                <label className="block text-white/80 mb-2">
                  Products & Services *
                </label>
                <textarea
                  value={formData.products_services}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      products_services: e.target.value,
                    })
                  }
                  rows={5}
                  className="w-full px-4 py-3 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Describe your products and services..."
                />
                {errors.products_services && (
                  <p className="text-red-400 text-sm mt-1">
                    {errors.products_services}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/80 mb-2">Team Size</label>
                  <input
                    type="number"
                    value={formData.team_size}
                    onChange={(e) =>
                      setFormData({ ...formData, team_size: e.target.value })
                    }
                    className="w-full px-4 py-3 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Number of team members"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-white/80 mb-2">Founder Experience (Years)</label>
                  <input
                    type="number"
                    value={formData.founder_experience_years}
                    onChange={(e) =>
                      setFormData({ ...formData, founder_experience_years: e.target.value })
                    }
                    className="w-full px-4 py-3 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Years of industry experience"
                    min="0"
                    max="50"
                  />
                  <p className="text-xs text-white/60 mt-1">Your years of experience in this industry</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Funding */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">
                Funding Information
              </h2>

              <div>
                <label className="block text-white/80 mb-2">
                  Funding Goal (USDC) *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
                  <input
                    type="number"
                    value={formData.funding_goal}
                    onChange={(e) =>
                      setFormData({ ...formData, funding_goal: e.target.value })
                    }
                    className="w-full pl-12 pr-4 py-3 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="500000"
                    min="0"
                    step="1000"
                  />
                </div>
                {errors.funding_goal && (
                  <p className="text-red-400 text-sm mt-1">
                    {errors.funding_goal}
                  </p>
                )}
                <p className="text-white/60 text-sm mt-2">
                  This is the total amount you're seeking to raise
                </p>
              </div>

              <div>
                <label className="block text-white/80 mb-2">
                  Pitch Deck URL
                </label>
                <div className="relative">
                  <Upload className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
                  <input
                    type="url"
                    value={formData.pitch_deck_url}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pitch_deck_url: e.target.value,
                      })
                    }
                    className="w-full pl-12 pr-4 py-3 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="https://yourstartup.com/pitch-deck.pdf"
                  />
                </div>
                <p className="text-white/60 text-sm mt-2">
                  Link to your pitch deck (PDF, Google Slides, etc.)
                </p>
              </div>

              {/* Wallet info — read-only, set via profile */}
              {user?.wallet_address && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 border border-white/10">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <div>
                    <p className="text-white/80 text-sm font-medium">Wallet linked to your profile</p>
                    <p className="font-mono text-xs text-white/50 break-all">{user.wallet_address}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="px-6 py-3 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-all"
            >
              Back
            </button>

            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all font-semibold"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit & Register"
                )}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
