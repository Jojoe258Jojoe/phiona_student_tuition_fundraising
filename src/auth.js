import { authService, userService } from './database.js'

class AuthManager {
  constructor() {
    this.currentUser = null
    this.isAuthenticated = false
    this.init()
  }

  async init() {
    // Check if user is already logged in
    const { success, user } = await authService.getCurrentUser()
    if (success && user) {
      this.currentUser = user
      this.isAuthenticated = true
      this.updateUI()
    }
  }

  async register(formData) {
    const { email, password, fullName, school, skills } = formData
    
    // First create the auth user without email verification
    const authResult = await authService.signUp(email, password, { fullName, school, skills })
    
    if (!authResult.success) {
      this.showMessage(authResult.error, 'error')
      return false
    }

    // Create profile data
    const profileData = {
      username: email.split('@')[0],
      full_name: fullName,
      bio: null,
      avatar_url: null,
      location: school || null
    }

    // Create the user profile
    const profileResult = await userService.createProfile(authResult.data.user.id, profileData)
    
    if (profileResult.success) {
      // Auto-login the user
      this.currentUser = authResult.data.user
      this.isAuthenticated = true
      this.updateUI()
      this.showMessage('Registration successful! Welcome to Phiona!', 'success')
      return true
    } else {
      this.showMessage('Registration failed. Please try again.', 'error')
      return false
    }
  }

  async login(email, password) {
    const result = await authService.signIn(email, password)
    
    if (result.success) {
      this.currentUser = result.data.user
      this.isAuthenticated = true
      this.updateUI()
      this.showMessage('Login successful!', 'success')
      this.closeModal()
      return true
    } else {
      this.showMessage(result.error, 'error')
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
    const result = await authService.resetPassword(email)
    
    if (result.success) {
      this.showMessage('Password reset email sent! Check your inbox.', 'success')
      return true
    } else {
      this.showMessage(result.error, 'error')
      return false
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
    }
  }
}

export const authManager = new AuthManager()