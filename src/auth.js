import { authService, userService } from './database.js'

class AuthManager {
  constructor() {
    this.currentUser = null
    this.isAuthenticated = false
    this.validationRules = {
      name: {
        required: true,
        minLength: 2,
        maxLength: 100,
        pattern: /^[a-zA-Z\s\-'.]+$/,
        message: 'Name must contain only letters, spaces, hyphens, and apostrophes'
      },
      email: {
        required: true,
        pattern: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
        message: 'Please enter a valid email address'
      },
      password: {
        required: true,
        minLength: 6,
        maxLength: 128,
        message: 'Password must be at least 6 characters long'
      },
      schoolUniversity: {
        required: true,
        minLength: 2,
        maxLength: 150,
        message: 'School/University name is required'
      },
      skills: {
        required: true,
        maxLength: 500,
        message: 'Please list your technical skills'
      }
    }
    this.init()
  }

  async init() {
    try {
      // Check if user is already logged in
      console.log('Initializing auth manager...')
      
      const { success, user } = await authService.getCurrentUser()
      if (success && user) {
        console.log('Found existing user session:', user.id)
        this.currentUser = user
        this.isAuthenticated = true
        this.updateUI()
      } else {
        console.log('No existing user session found')
        this.currentUser = null
        this.isAuthenticated = false
        this.updateUI()
      }
      
      // Listen for auth state changes
      supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event, session?.user?.id)
        
        if (event === 'SIGNED_IN' && session?.user) {
          this.currentUser = session.user
          this.isAuthenticated = true
          this.updateUI()
        } else if (event === 'SIGNED_OUT') {
          this.currentUser = null
          this.isAuthenticated = false
          this.updateUI()
        }
      })
      
    } catch (error) {
      console.error('Error initializing auth manager:', error)
      this.currentUser = null
      this.isAuthenticated = false
      this.updateUI()
    }
  }

  async register(formData) {
    // Validate form data before submission
    const validation = this.validateRegistrationForm(formData)
    if (!validation.isValid) {
      this.displayValidationErrors(validation.errors)
      return false
    }

    console.log('Registration form validation passed')
    
    // Use the new registration system
    const result = await userService.registerUser(formData)
    
    if (result.success) {
      console.log('Registration successful:', result.message)
      this.showMessage(result.message || 'Registration successful!', 'success')
      this.closeModal()
      this.clearFormErrors()
      return true
    } else {
      console.error('Registration failed:', result.error)
      this.showMessage(result.error, 'error')
      return false
    }
  }

  async login(email, password) {
    try {
      // Input validation - ensure values are valid strings
      if (!email || typeof email !== 'string') {
        this.showMessage('Email is required', 'error')
        return false
      }
      
      if (!password || typeof password !== 'string') {
        this.showMessage('Password is required', 'error')
        return false
      }
      
      // Trim whitespace and validate
      const trimmedEmail = email.trim()
      const trimmedPassword = password.trim()
      
      if (!trimmedEmail || !this.validationRules.email.pattern.test(trimmedEmail)) {
        this.displayLoginErrors({ email: 'Please enter a valid email address' })
        return false
      }
      
      if (!trimmedPassword || trimmedPassword.length < 6) {
        this.displayLoginErrors({ password: 'Password must be at least 6 characters long' })
        return false
      }

      console.log('Attempting login for:', trimmedEmail)

      // Use proper signInWithPassword implementation
      const result = await authService.signIn(trimmedEmail, trimmedPassword)
      
      if (result.success && result.data?.user) {
        this.currentUser = result.data.user
        this.isAuthenticated = true
        this.updateUI()
        this.showMessage('Login successful!', 'success')
        this.closeModal()
        this.clearFormErrors()
        console.log('Login successful for user:', result.data.user.id)
        return true
      } else {
        const errorMessage = result.error || 'Login failed'
        console.error('Login failed:', errorMessage)
        this.showMessage(errorMessage, 'error')
        return false
      }
      
    } catch (error) {
      console.error('Unexpected error during login:', error)
      this.showMessage('An unexpected error occurred. Please try again.', 'error')
      return false
    }
  }

  async logout() {
    const result = await authService.signOut()
    
    if (result.success) {
      this.currentUser = null
      this.isAuthenticated = false
      this.updateUI()
      this.showMessage('Logged out successfully!', 'success')
    }
  }

  async resetPassword(email) {
    // Validate email
    if (!email || !this.validationRules.email.pattern.test(email)) {
      this.displayResetPasswordErrors({ email: 'Please enter a valid email address' })
      return false
    }

    const result = await authService.resetPassword(email)
    
    if (result.success) {
      this.showMessage('Password reset email sent! Check your inbox.', 'success')
      this.clearFormErrors()
      return true
    } else {
      this.showMessage(result.error, 'error')
      return false
    }
  }

  validateRegistrationForm(formData) {
    const errors = {}
    
    // Validate name
    if (!formData.name || formData.name.trim().length === 0) {
      errors.name = 'Full name is required'
    } else if (formData.name.trim().length < this.validationRules.name.minLength) {
      errors.name = `Name must be at least ${this.validationRules.name.minLength} characters`
    } else if (formData.name.trim().length > this.validationRules.name.maxLength) {
      errors.name = `Name must be less than ${this.validationRules.name.maxLength} characters`
    } else if (!this.validationRules.name.pattern.test(formData.name.trim())) {
      errors.name = this.validationRules.name.message
    }

    // Validate email
    if (!formData.email || formData.email.trim().length === 0) {
      errors.email = 'Email address is required'
    } else if (!this.validationRules.email.pattern.test(formData.email.trim())) {
      errors.email = this.validationRules.email.message
    }

    // Validate school/university
    if (!formData.schoolUniversity || formData.schoolUniversity.trim().length === 0) {
      errors.schoolUniversity = 'School/University is required'
    } else if (formData.schoolUniversity.trim().length < this.validationRules.schoolUniversity.minLength) {
      errors.schoolUniversity = 'School/University name is too short'
    } else if (formData.schoolUniversity.trim().length > this.validationRules.schoolUniversity.maxLength) {
      errors.schoolUniversity = 'School/University name is too long'
    }

    // Validate skills
    if (!formData.skills || formData.skills.trim().length === 0) {
      errors.skills = 'Technical skills are required'
    } else if (formData.skills.trim().length > this.validationRules.skills.maxLength) {
      errors.skills = 'Skills description is too long'
    }

    // Validate password
    if (!formData.password || formData.password.length === 0) {
      errors.password = 'Password is required'
    } else if (formData.password.length < this.validationRules.password.minLength) {
      errors.password = `Password must be at least ${this.validationRules.password.minLength} characters`
    } else if (formData.password.length > this.validationRules.password.maxLength) {
      errors.password = `Password must be less than ${this.validationRules.password.maxLength} characters`
    }

    // Validate password confirmation
    if (!formData.passwordConfirmation || formData.passwordConfirmation.length === 0) {
      errors.passwordConfirmation = 'Password confirmation is required'
    } else if (formData.password !== formData.passwordConfirmation) {
      errors.passwordConfirmation = 'Passwords do not match'
    }

    // Validate terms agreement
    if (!formData.agreeTerms) {
      errors.agreeTerms = 'You must agree to the Terms of Service and Privacy Policy'
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }

  displayValidationErrors(errors) {
    // Clear previous errors
    this.clearFormErrors()
    
    // Display new errors
    Object.keys(errors).forEach(field => {
      const errorElement = document.getElementById(`register${field.charAt(0).toUpperCase() + field.slice(1)}Error`)
      const inputElement = document.getElementById(`register${field.charAt(0).toUpperCase() + field.slice(1)}`)
      
      if (errorElement) {
        errorElement.textContent = errors[field]
        errorElement.style.display = 'block'
      }
      
      if (inputElement) {
        inputElement.classList.add('error')
      }
    })
  }

  displayLoginErrors(errors) {
    this.clearFormErrors()
    
    Object.keys(errors).forEach(field => {
      const errorElement = document.getElementById(`login${field.charAt(0).toUpperCase() + field.slice(1)}Error`)
      const inputElement = document.getElementById(`login${field.charAt(0).toUpperCase() + field.slice(1)}`)
      
      if (errorElement) {
        errorElement.textContent = errors[field]
        errorElement.style.display = 'block'
      }
      
      if (inputElement) {
        inputElement.classList.add('error')
      }
    })
  }

  displayResetPasswordErrors(errors) {
    this.clearFormErrors()
    
    Object.keys(errors).forEach(field => {
      const errorElement = document.getElementById(`reset${field.charAt(0).toUpperCase() + field.slice(1)}Error`)
      const inputElement = document.getElementById(`reset${field.charAt(0).toUpperCase() + field.slice(1)}`)
      
      if (errorElement) {
        errorElement.textContent = errors[field]
        errorElement.style.display = 'block'
      }
      
      if (inputElement) {
        inputElement.classList.add('error')
      }
    })
  }

  clearFormErrors() {
    // Clear all error messages
    document.querySelectorAll('.field-error').forEach(el => {
      el.textContent = ''
      el.style.display = 'none'
    })
    
    // Remove error classes from inputs
    document.querySelectorAll('.form-input.error').forEach(el => {
      el.classList.remove('error')
    })
  }

  checkPasswordStrength(password) {
    let strength = 0
    let feedback = []

    if (password.length >= 8) strength += 1
    else feedback.push('At least 8 characters')

    if (/[a-z]/.test(password)) strength += 1
    else feedback.push('Lowercase letter')

    if (/[A-Z]/.test(password)) strength += 1
    else feedback.push('Uppercase letter')

    if (/[0-9]/.test(password)) strength += 1
    else feedback.push('Number')

    if (/[^A-Za-z0-9]/.test(password)) strength += 1
    else feedback.push('Special character')

    const levels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong']
    return {
      score: strength,
      level: levels[Math.min(strength, 4)],
      feedback: feedback
    }
  }

  updateUI() {
    const authButtons = document.querySelector('.auth-buttons')
    const userProfile = document.querySelector('.user-profile')
    
    if (this.isAuthenticated) {
      if (authButtons) authButtons.style.display = 'none'
      if (userProfile) {
        userProfile.style.display = 'flex'
        const emailElement = userProfile.querySelector('.user-email')
        if (emailElement) {
          emailElement.textContent = this.currentUser.email
        }
      }
    } else {
      if (authButtons) authButtons.style.display = 'flex'
      if (userProfile) userProfile.style.display = 'none'
    }
  }

  showMessage(message, type) {
    const messageDiv = document.createElement('div')
    messageDiv.className = `message ${type}`
    messageDiv.textContent = message
    
    document.body.appendChild(messageDiv)
    
    setTimeout(() => {
      messageDiv.remove()
    }, 5000)
  }

  closeModal() {
    const modal = document.querySelector('.auth-modal')
    if (modal) {
      modal.style.display = 'none'
      this.clearFormErrors()
    }
  }
}

export const authManager = new AuthManager()