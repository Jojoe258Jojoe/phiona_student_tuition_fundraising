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
    
    const userData = {
      full_name: fullName,
      school: school,
      skills: skills
    }

    const result = await authService.signUp(email, password, userData)
    
    if (result.success) {
      this.showMessage('Registration successful! Please check your email to verify your account.', 'success')
      return true
    } else {
      this.showMessage(result.error, 'error')
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
      authButtons.style.display = 'none'
      userProfile.style.display = 'flex'
      userProfile.querySelector('.user-email').textContent = this.currentUser.email
    } else {
      authButtons.style.display = 'flex'
      userProfile.style.display = 'none'
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