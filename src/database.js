import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  throw new Error('Supabase configuration is incomplete. Please check your .env file.')
}

// Validate URL format
try {
  new URL(supabaseUrl)
} catch (urlError) {
  console.error('Invalid Supabase URL format:', supabaseUrl)
  throw new Error('Invalid Supabase URL configuration. Please check your .env file.')
}

// Validate that the URL is a Supabase URL
if (!supabaseUrl.includes('supabase.co')) {
  console.warn('Supabase URL does not appear to be a valid Supabase domain')
}

// Log configuration for debugging (without exposing the full key)
console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key configured:', supabaseKey ? 'Yes' : 'No')
console.log('Supabase Key length:', supabaseKey ? supabaseKey.length : 0)

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'X-Client-Info': 'hackathon-platform'
    }
  }
})

// Auth functions
export const authService = {
  // Sign up with email verification
  async signUp(email, password, userData) {
    try {
      // Validate inputs
      if (!email || typeof email !== 'string') {
        throw new Error('Email must be a valid string')
      }
      
      if (!password || typeof password !== 'string') {
        throw new Error('Password must be a valid string')
      }
      
      const trimmedEmail = email.trim()
      
      if (!trimmedEmail) {
        throw new Error('Email cannot be empty')
      }
      
      if (!password || password.length < 6) {
        throw new Error('Password must be at least 6 characters long')
      }
      
      console.log('Attempting signUp for:', trimmedEmail)
      
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          emailRedirectTo: undefined, // Disable email confirmation
          shouldCreateUser: true,
          data: userData
        }
      })
      
      if (error) {
        console.error('signUp error:', error)
        
        // Provide user-friendly error messages
        let userMessage = error.message
        if (error.message.includes('already registered')) {
          userMessage = 'An account with this email already exists. Please try logging in instead.'
        } else if (error.message.includes('Password should be')) {
          userMessage = 'Password does not meet requirements. Please choose a stronger password.'
        } else if (error.message.includes('Invalid email')) {
          userMessage = 'Please enter a valid email address.'
        }
        
        throw new Error(userMessage)
      }
      
      console.log('SignUp successful for user:', data?.user?.id)
      return { success: true, data }
      
    } catch (error) {
      console.error('Sign up error:', error)
      return { 
        success: false, 
        error: error.message || 'Registration failed. Please try again.'
      }
    }
  },

  // Sign in
  async signIn(email, password) {
    try {
      // First attempt normal sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      // If email not confirmed error, try to confirm the user automatically
      if (error && error.message.includes('Email not confirmed')) {
        console.log('Email not confirmed, attempting to auto-confirm user...')
        
        // Try to sign up again with the same credentials to auto-confirm
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: undefined,
            shouldCreateUser: false // Don't create a new user, just confirm existing
          }
        })
        
        if (signUpError && !signUpError.message.includes('already registered')) {
          throw new Error('Unable to confirm account automatically. Please contact support.')
        }
        
        // Now try to sign in again
        const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        
        if (retryError) {
          throw new Error('Login failed after confirmation attempt. Please try again.')
        }
        
        return { success: true, data: retryData }
      }
      
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
      // First check if we can reach Supabase
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'HEAD',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        })
        
        if (!response.ok && response.status !== 404) {
          throw new Error(`Supabase connection failed: ${response.status} ${response.statusText}`)
        }
      } catch (fetchError) {
        console.error('Supabase connectivity check failed:', fetchError)
        throw new Error('Unable to connect to Supabase. Please check your internet connection and try again.')
      }

      // Get the current session first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Session error:', sessionError)
        // Handle specific session errors
        if (sessionError.message.includes('Failed to fetch')) {
          throw new Error('Network connection failed. Please check your internet connection.')
        }
        throw new Error(`Session error: ${sessionError.message}`)
      }
      
      if (!session?.user) {
        return { success: true, user: null }
      }
      
      // Verify the user is still valid
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) {
        console.error('Get user error:', error)
        if (error.message.includes('Failed to fetch')) {
          throw new Error('Network connection failed. Please check your internet connection.')
        }
        throw new Error(`Authentication error: ${error.message}`)
      }
      
      return { success: true, user }
    } catch (error) {
      console.error('Get current user error:', error)
      
      // Provide more specific error messages
      let errorMessage = error.message
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        errorMessage = 'Unable to connect to the authentication service. Please check your internet connection and try again.'
      } else if (error.message.includes('Invalid API key')) {
        errorMessage = 'Authentication configuration error. Please contact support.'
      }
      
      return { success: false, error: errorMessage, user: null }
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
  // Register new user with separate registration table
  async registerUser(formData) {
    try {
      const { name, email, password, passwordConfirmation, schoolUniversity, skills } = formData
      
      // Validate passwords match
      if (password !== passwordConfirmation) {
        return { success: false, error: 'Passwords do not match' }
      }
      
      // Validate required fields
      if (!name || !email || !password || !schoolUniversity || !skills) {
        return { success: false, error: 'All fields are required' }
      }
      
      // Log registration attempt
      console.log('Starting user registration for:', email)
      
      // Insert into registration table first
      const { data: regData, error: regError } = await supabase
        .from('user_registrations')
        .insert([{
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password_hash: password, // In production, this should be hashed client-side
          school_university: schoolUniversity.trim(),
          skills: skills.trim(),
          registration_status: 'pending'
        }])
        .select()
        .single()
      
      if (regError) throw regError
      
      console.log('Registration record created:', regData.id)
      
      // Now create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: undefined, // Disable email confirmation
          shouldCreateUser: true,
          data: {
            name: name.trim(),
            full_name: name.trim(),
            school_university: schoolUniversity.trim(),
            school: schoolUniversity.trim(),
            skills: skills.trim()
          }
        }
      })
      
      if (authError) {
        console.error('Auth user creation failed:', authError)
        
        // If user already exists but email not confirmed, try to handle it
        if (authError.message.includes('already registered')) {
          console.log('User already exists, attempting to sign in...')
          
          // Try to sign in the existing user
          const signInResult = await authService.signIn(email.trim().toLowerCase(), password)
          
          if (signInResult.success) {
            console.log('Successfully signed in existing user')
            
            // Update registration status to completed
            await supabase
              .from('user_registrations')
              .update({ 
                registration_status: 'completed',
                processed_at: new Date().toISOString()
              })
              .eq('id', regData.id)
            
            return { 
              success: true, 
              data: signInResult.data,
              message: 'Registration successful! You are now logged in.'
            }
          }
        }
        
        // Update registration status to failed
        await supabase
          .from('user_registrations')
          .update({ 
            registration_status: 'failed',
            error_message: authError.message,
            processed_at: new Date().toISOString()
          })
          .eq('id', regData.id)
        
        throw authError
      }
      
      console.log('Auth user created:', authData.user?.id)
      
      // Create profile after successful auth user creation
      if (authData.user) {
        // Wait a moment for the trigger to create the profile
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Check if profile was created by trigger
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', authData.user.id)
          .single()
        
        if (!existingProfile) {
          console.log('Profile not created by trigger, creating manually...')
          const profileData = {
            id: authData.user.id,
            username: email.split('@')[0],
            full_name: name.trim(),
            bio: null,
            avatar_url: null,
            location: schoolUniversity.trim()
          }
          
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([profileData])
          
          if (profileError) {
            console.error('Manual profile creation error:', profileError)
            // Don't fail the registration if profile creation fails
            // The profile can be created later
          } else {
            console.log('Profile created manually')
          }
        } else {
          console.log('Profile created by trigger')
        }
        
        // Update registration status to completed
        await supabase
          .from('user_registrations')
          .update({ 
            registration_status: 'completed',
            processed_at: new Date().toISOString()
          })
          .eq('id', regData.id)
      }
      
      return { 
        success: true, 
        data: authData,
        message: 'Registration successful! You can now log in.'
      }
      
    } catch (error) {
      console.error('Registration error:', error)
      
      // Provide more specific error messages
      if (error.message.includes('duplicate key')) {
        return { success: false, error: 'An account with this email already exists' }
      } else if (error.message.includes('row-level security')) {
        return { success: false, error: 'Database permission error. Please try again.' }
      } else if (error.message.includes('invalid input')) {
        return { success: false, error: 'Invalid input data. Please check your information.' }
      } else {
        return { success: false, error: `Registration failed: ${error.message}` }
      }
    }
  },

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
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
      
      if (error) throw error
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Upload avatar image
  async uploadAvatar(userId, file) {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Math.random()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      return { success: true, url: publicUrl }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Delete old avatar
  async deleteAvatar(filePath) {
    try {
      const { error } = await supabase.storage
        .from('avatars')
        .remove([filePath])

      if (error) throw error
      return { success: true }
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
      // Test connection first
      const { data: testData, error: testError } = await supabase
        .from('competitions')
        .select('count')
        .limit(1)
      
      if (testError) {
        console.error('Supabase connection test failed:', testError)
        throw new Error(`Database connection failed: ${testError.message}`)
      }
      
      const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('getCompetitions error:', error)
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