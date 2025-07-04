import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// Auth functions
export const authService = {
  // Sign up with email verification
  async signUp(email, password, userData) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`,
          data: userData
        }
      })
      
      if (error) throw error
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Sign in
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Sign out
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      return { success: true, user }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Reset password
  async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      if (error) throw error
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }
}

// User profile functions
export const userService = {
  // Create user profile
  async createProfile(userId, profileData) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([{
          id: userId,
          ...profileData,
          created_at: new Date().toISOString()
        }])
        .select()
      
      if (error) throw error
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Get user profile
  async getProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) throw error
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Update user profile
  async updateProfile(userId, updates) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
      
      if (error) throw error
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }
}

// Competition functions
export const competitionService = {
  // Get all competitions
  async getCompetitions() {
    try {
      const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Join competition
  async joinCompetition(userId, competitionId) {
    try {
      const { data, error } = await supabase
        .from('competition_participants')
        .insert([{
          user_id: userId,
          competition_id: competitionId,
          joined_at: new Date().toISOString()
        }])
        .select()
      
      if (error) throw error
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }
}

// Hackathon registration functions
export const hackathonService = {
  // Input validation and sanitization
  validateRegistrationData(formData) {
    const errors = []
    
    // Validate hackathon name
    if (!formData.hackathonName || typeof formData.hackathonName !== 'string') {
      errors.push('Hackathon name is required')
    } else {
      const sanitizedName = formData.hackathonName.trim()
      if (sanitizedName.length === 0) {
        errors.push('Hackathon name cannot be empty')
      } else if (sanitizedName.length > 200) {
        errors.push('Hackathon name is too long (max 200 characters)')
      } else if (!/^[a-zA-Z0-9\s\-_.,!()&]+$/.test(sanitizedName)) {
        errors.push('Hackathon name contains invalid characters')
      }
    }
    
    // Validate full name
    if (!formData.fullName || typeof formData.fullName !== 'string') {
      errors.push('Full name is required')
    } else {
      const sanitizedName = formData.fullName.trim()
      if (sanitizedName.length === 0) {
        errors.push('Full name cannot be empty')
      } else if (sanitizedName.length > 100) {
        errors.push('Full name is too long (max 100 characters)')
      } else if (!/^[a-zA-Z\s\-'.]+$/.test(sanitizedName)) {
        errors.push('Full name contains invalid characters')
      }
    }
    
    // Validate email
    if (!formData.email || typeof formData.email !== 'string') {
      errors.push('Email is required')
    } else {
      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
      if (!emailRegex.test(formData.email.trim())) {
        errors.push('Invalid email format')
      }
    }
    
    // Validate university
    if (!formData.university || typeof formData.university !== 'string') {
      errors.push('University is required')
    } else {
      const sanitizedUniversity = formData.university.trim()
      if (sanitizedUniversity.length === 0) {
        errors.push('University cannot be empty')
      } else if (sanitizedUniversity.length > 150) {
        errors.push('University name is too long (max 150 characters)')
      }
    }
    
    // Validate skillset
    if (!formData.skillset || typeof formData.skillset !== 'string') {
      errors.push('Skillset is required')
    } else {
      const sanitizedSkillset = formData.skillset.trim()
      if (sanitizedSkillset.length === 0) {
        errors.push('Skillset cannot be empty')
      } else if (sanitizedSkillset.length > 500) {
        errors.push('Skillset description is too long (max 500 characters)')
      }
    }
    
    // Validate experience
    const validExperience = ['first-time', 'some', 'many']
    if (!formData.experience || !validExperience.includes(formData.experience)) {
      errors.push('Invalid experience level')
    }
    
    // Validate project interest (optional)
    if (formData.projectInterest && typeof formData.projectInterest === 'string') {
      if (formData.projectInterest.trim().length > 1000) {
        errors.push('Project interest description is too long (max 1000 characters)')
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: errors.length === 0 ? {
        hackathonName: formData.hackathonName.trim(),
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        university: formData.university.trim(),
        skillset: formData.skillset.trim(),
        experience: formData.experience,
        projectInterest: formData.projectInterest ? formData.projectInterest.trim() : null
      } : null
    }
  },

  // Register for hackathon
  async registerForHackathon(userId, formData) {
    try {
      // Validate input data
      const validation = this.validateRegistrationData(formData)
      if (!validation.isValid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors.join(', ')}`
        }
      }

      const sanitizedData = validation.sanitizedData

      // Check if user is authenticated
      if (!userId) {
        return {
          success: false,
          error: 'User must be logged in to register for hackathons'
        }
      }

      // Check if user already registered for this hackathon
      const { data: existingRegistration, error: checkError } = await supabase
        .from('registered_hackathons')
        .select('id')
        .eq('user_id', userId)
        .eq('hackathon_name', sanitizedData.hackathonName)
        .single()

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw checkError
      }

      if (existingRegistration) {
        return {
          success: false,
          error: 'You have already registered for this hackathon'
        }
      }

      // Insert registration record
      const { data, error } = await supabase
        .from('registered_hackathons')
        .insert([{
          hackathon_name: sanitizedData.hackathonName,
          user_id: userId,
          registration_timestamp: new Date().toISOString(),
          registration_status: 'completed',
          full_name: sanitizedData.fullName,
          email: sanitizedData.email,
          university: sanitizedData.university,
          skillset: sanitizedData.skillset,
          experience: sanitizedData.experience,
          project_interest: sanitizedData.projectInterest
        }])
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        data,
        message: `Successfully registered for ${sanitizedData.hackathonName}! Your registration has been confirmed.`
      }
    } catch (error) {
      console.error('Hackathon registration error:', error)
      
      // Handle specific database errors
      if (error.code === '23505') { // Unique constraint violation
        return {
          success: false,
          error: 'You have already registered for this hackathon'
        }
      } else if (error.code === '23503') { // Foreign key constraint violation
        return {
          success: false,
          error: 'Invalid user account. Please log in again.'
        }
      } else if (error.code === '23514') { // Check constraint violation
        return {
          success: false,
          error: 'Invalid registration data provided'
        }
      } else {
        return {
          success: false,
          error: `Registration failed: ${error.message}`
        }
      }
    }
  },

  // Get user's hackathon registrations
  async getUserRegistrations(userId) {
    try {
      const { data, error } = await supabase
        .from('registered_hackathons')
        .select('*')
        .eq('user_id', userId)
        .order('registration_timestamp', { ascending: false })

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Get hackathon registration statistics
  async getHackathonStats(hackathonName) {
    try {
      const { data, error } = await supabase
        .from('registered_hackathons')
        .select('id, registration_timestamp, university')
        .eq('hackathon_name', hackathonName)
        .eq('registration_status', 'completed')

      if (error) throw error
      
      return {
        success: true,
        data: {
          totalRegistrations: data.length,
          registrations: data
        }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }
}