import { hackathonService } from './database.js'
import { authManager } from './auth.js'

class HackathonRegistrationManager {
  constructor() {
    this.currentHackathonName = 'Student Hackathon 2024' // Default hackathon name
    this.init()
  }

  init() {
    // Set up form submission handlers
    this.setupFormHandlers()
    // Set up success message handlers
    this.setupMessageHandlers()
  }

  setupFormHandlers() {
    // Handle registration form submission
    document.addEventListener('DOMContentLoaded', () => {
      const form = document.getElementById('hackathonForm')
      if (form) {
        form.addEventListener('submit', (e) => this.handleFormSubmission(e))
      }
    })
  }

  setupMessageHandlers() {
    // Create success message container if it doesn't exist
    if (!document.getElementById('registrationMessages')) {
      const messageContainer = document.createElement('div')
      messageContainer.id = 'registrationMessages'
      messageContainer.className = 'registration-messages'
      document.body.appendChild(messageContainer)
    }
  }

  async handleFormSubmission(event) {
    event.preventDefault()
    
    const form = event.target
    const submitButton = form.querySelector('button[type="submit"]')
    const originalButtonText = submitButton.textContent

    try {
      // Show loading state
      submitButton.textContent = 'Registering...'
      submitButton.disabled = true
      form.classList.add('loading')

      // Extract form data
      const formData = this.extractFormData(form)
      
      // Add hackathon name to form data
      formData.hackathonName = this.currentHackathonName

      // Check if user is authenticated
      if (!authManager.isAuthenticated) {
        this.showMessage('Please log in to register for hackathons', 'error')
        this.redirectToLogin()
        return
      }

      // Register for hackathon
      const result = await hackathonService.registerForHackathon(
        authManager.currentUser.id,
        formData
      )

      if (result.success) {
        this.showSuccessMessage(result.message)
        this.resetForm(form)
        this.showRegistrationStats()
      } else {
        this.showMessage(result.error, 'error')
      }

    } catch (error) {
      console.error('Registration submission error:', error)
      this.showMessage('An unexpected error occurred. Please try again.', 'error')
    } finally {
      // Reset button state
      submitButton.textContent = originalButtonText
      submitButton.disabled = false
      form.classList.remove('loading')
    }
  }

  extractFormData(form) {
    const formData = new FormData(form)
    return {
      fullName: formData.get('fullName'),
      email: formData.get('email'),
      university: formData.get('university'),
      skillset: formData.get('skillset'),
      experience: formData.get('experience'),
      projectInterest: formData.get('projectInterest')
    }
  }

  showSuccessMessage(message) {
    // Show success message in the form
    const successDiv = document.getElementById('successMessage')
    if (successDiv) {
      successDiv.textContent = message
      successDiv.style.display = 'block'
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        successDiv.style.display = 'none'
      }, 5000)
    }

    // Also show global message
    this.showMessage(message, 'success')
  }

  showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div')
    messageDiv.className = `registration-message ${type}`
    messageDiv.innerHTML = `
      <div class="message-content">
        <span class="message-text">${message}</span>
        <button class="message-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
      </div>
    `

    const container = document.getElementById('registrationMessages')
    container.appendChild(messageDiv)

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.remove()
      }
    }, 5000)

    // Add entrance animation
    setTimeout(() => {
      messageDiv.classList.add('show')
    }, 10)
  }

  resetForm(form) {
    form.reset()
    
    // Reset any custom styling
    const inputs = form.querySelectorAll('input, textarea, select')
    inputs.forEach(input => {
      input.classList.remove('error', 'success')
    })
  }

  redirectToLogin() {
    // If on main page, open auth modal
    if (typeof openAuthModal === 'function') {
      openAuthModal('login')
    } else {
      // Redirect to main page with login prompt
      window.location.href = '/#login'
    }
  }

  async showRegistrationStats() {
    try {
      const stats = await hackathonService.getHackathonStats(this.currentHackathonName)
      if (stats.success) {
        const count = stats.data.totalRegistrations
        this.showMessage(`You're one of ${count} students registered for this hackathon!`, 'info')
      }
    } catch (error) {
      console.error('Error fetching registration stats:', error)
    }
  }

  // Method to set hackathon name dynamically
  setHackathonName(name) {
    this.currentHackathonName = name
  }

  // Method to get user's registrations
  async getUserRegistrations() {
    if (!authManager.isAuthenticated) {
      return { success: false, error: 'User not authenticated' }
    }

    return await hackathonService.getUserRegistrations(authManager.currentUser.id)
  }
}

// Create global instance
export const hackathonRegistrationManager = new HackathonRegistrationManager()

// Make it available globally for HTML pages
window.hackathonRegistrationManager = hackathonRegistrationManager