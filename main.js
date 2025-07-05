import './style.css'
import { authManager } from './src/auth.js'
import { createAuthModal, createUserProfile } from './src/components.js'
import { competitionService } from './src/database.js'
import { hackathonRegistrationManager } from './src/hackathon-registration.js'

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
  // Add auth modal to the page
  document.body.insertAdjacentHTML('beforeend', createAuthModal())
  
  // Add user profile to navigation
  const navContainer = document.querySelector('.nav-container')
  const authButtonsHTML = `
    <div class="auth-buttons">
      <button class="btn btn-secondary" onclick="openAuthModal('login')">Login</button>
      <button class="btn btn-primary" onclick="openAuthModal('register')">Sign Up</button>
    </div>
  `
  navContainer.insertAdjacentHTML('beforeend', authButtonsHTML)
  navContainer.insertAdjacentHTML('beforeend', createUserProfile())

  // Initialize auth manager
  await authManager.init()

  // Load competitions from database
  await loadCompetitions()

  // Set up event listeners
  setupEventListeners()

  // Initialize story animations
  initializeStoryAnimations()
})

// Global functions for modal management
window.openAuthModal = (tab = 'login') => {
  const modal = document.getElementById('authModal')
  modal.style.display = 'flex'
  showTab(tab)
}

window.closeAuthModal = () => {
  const modal = document.getElementById('authModal')
  modal.style.display = 'none'
}

window.showTab = (tabName) => {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active')
  })
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active')
  })

  // Show selected tab
  document.getElementById(tabName + 'Tab').classList.add('active')
  document.querySelector(`[onclick="showTab('${tabName}')"]`).classList.add('active')
}

window.showForgotPassword = () => {
  showTab('forgotPassword')
}

window.authManager = authManager
window.hackathonRegistrationManager = hackathonRegistrationManager

async function loadCompetitions() {
  const result = await competitionService.getCompetitions()
  
  if (result.success && result.data) {
    updateCompetitionsDisplay(result.data)
  }
}

function updateCompetitionsDisplay(competitions) {
  const competitionsGrid = document.querySelector('.competitions-grid')
  
  competitionsGrid.innerHTML = competitions.map(comp => `
    <div class="competition-card" data-category="${comp.category}">
      <div class="card-header">
        <span class="category-badge ${comp.category}">${comp.category}</span>
        <span class="status-badge ${comp.status}">${comp.status}</span>
      </div>
      <h3 class="card-title">${comp.title}</h3>
      <p class="card-description">${comp.description}</p>
      <div class="prize-info">
        <span class="prize-amount">$${comp.prize_amount.toLocaleString()}</span>
        <span class="participants">${comp.participant_count || 0} participants</span>
      </div>
      <div class="card-footer">
        <span class="time-left">${getTimeLeft(comp.end_date)}</span>
        <button class="btn btn-small" onclick="joinCompetition('${comp.id}')">
          ${comp.status === 'upcoming' ? 'Register' : 'Join Now'}
        </button>
      </div>
    </div>
  `).join('')
}

function getTimeLeft(endDate) {
  const now = new Date()
  const end = new Date(endDate)
  const diff = end - now
  
  if (diff <= 0) return 'Ended'
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  
  if (days > 0) return `${days} days left`
  if (hours > 0) return `${hours} hours left`
  return 'Ending soon'
}

window.joinCompetition = async (competitionId) => {
  if (!authManager.isAuthenticated) {
    openAuthModal('login')
    authManager.showMessage('Please login to join competitions', 'info')
    return
  }

  const result = await competitionService.joinCompetition(authManager.currentUser.id, competitionId)
  
  if (result.success) {
    authManager.showMessage('Successfully joined the competition!', 'success')
    loadCompetitions() // Refresh competitions
  } else {
    authManager.showMessage(result.error, 'error')
  }
}

function initializeStoryAnimations() {
  // Intersection Observer for story cards
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animationDelay = `${Math.random() * 0.3}s`
        entry.target.classList.add('animate-on-scroll')
      }
    })
  }, observerOptions)

  // Observe all story cards
  document.querySelectorAll('.story-card').forEach(card => {
    observer.observe(card)
  })
}

function setupEventListeners() {
  // Login form
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    
    const submitButton = e.target.querySelector('button[type="submit"]')
    const btnText = submitButton.querySelector('.btn-text')
    const btnLoading = submitButton.querySelector('.btn-loading')
    
    // Show loading state
    btnText.style.display = 'none'
    btnLoading.style.display = 'flex'
    submitButton.disabled = true
    
    const email = document.getElementById('loginEmail').value.trim()
    const password = document.getElementById('loginPassword').value
    
    const success = await authManager.login(email, password)
    if (success) {
      await loadCompetitions()
    }
    
    // Reset button state
    btnText.style.display = 'inline'
    btnLoading.style.display = 'none'
    submitButton.disabled = false
  })

  // Register form
  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    
    const submitButton = e.target.querySelector('button[type="submit"]')
    const originalText = submitButton.textContent
    
    // Show loading state
    const btnText = submitButton.querySelector('.btn-text')
    const btnLoading = submitButton.querySelector('.btn-loading')
    btnText.style.display = 'none'
    btnLoading.style.display = 'flex'
    submitButton.disabled = true
    
    const formData = {
      name: document.getElementById('registerName').value.trim(),
      email: document.getElementById('registerEmail').value.trim(),
      password: document.getElementById('registerPassword').value,
      passwordConfirmation: document.getElementById('registerPasswordConfirm').value,
      schoolUniversity: document.getElementById('registerSchoolUniversity').value.trim(),
      skills: document.getElementById('registerSkills').value.trim(),
      agreeTerms: document.getElementById('agreeTerms').checked
    }
    
    const success = await authManager.register(formData)
    if (success) {
      closeAuthModal()
      // Reload competitions to show user-specific data
      await loadCompetitions()
    }
    
    // Reset button state
    btnText.style.display = 'inline'
    btnLoading.style.display = 'none'
    submitButton.disabled = false
  })

  // Forgot password form
  document.getElementById('forgotPasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    
    const submitButton = e.target.querySelector('button[type="submit"]')
    const btnText = submitButton.querySelector('.btn-text')
    const btnLoading = submitButton.querySelector('.btn-loading')
    
    // Show loading state
    btnText.style.display = 'none'
    btnLoading.style.display = 'flex'
    submitButton.disabled = true
    
    const email = document.getElementById('resetEmail').value.trim()
    
    const success = await authManager.resetPassword(email)
    if (success) {
      showTab('login')
    }
    
    // Reset button state
    btnText.style.display = 'inline'
    btnLoading.style.display = 'none'
    submitButton.disabled = false
  })

  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const filter = e.target.dataset.filter
      
      // Update active button
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'))
      e.target.classList.add('active')
      
      // Filter competitions
      document.querySelectorAll('.competition-card').forEach(card => {
        if (filter === 'all' || card.dataset.category === filter) {
          card.style.display = 'block'
        } else {
          card.style.display = 'none'
        }
      })
    })
  })

  // Mobile navigation
  const navToggle = document.querySelector('.nav-toggle')
  const navMenu = document.querySelector('.nav-menu')
  
  if (navToggle) {
    navToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active')
    })
  }

  // Close modal when clicking outside
  window.addEventListener('click', (e) => {
    const modal = document.getElementById('authModal')
    if (e.target === modal) {
      closeAuthModal()
    }
  })

  // Story card hover effects
  document.querySelectorAll('.story-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-10px) scale(1.02)'
    })
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0) scale(1)'
    })
  })
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault()
    const target = document.querySelector(this.getAttribute('href'))
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }
  })
})

// Global functions for form interactions
window.togglePassword = (inputId) => {
  const input = document.getElementById(inputId)
  const toggle = input.nextElementSibling.querySelector('.toggle-icon')
  
  if (input.type === 'password') {
    input.type = 'text'
    toggle.textContent = '🙈'
  } else {
    input.type = 'password'
    toggle.textContent = '👁️'
  }
}

// Real-time validation for registration form
document.addEventListener('DOMContentLoaded', () => {
  // Password strength checker
  const passwordInput = document.getElementById('registerPassword')
  const passwordStrengthDiv = document.getElementById('passwordStrength')
  
  if (passwordInput && passwordStrengthDiv) {
    passwordInput.addEventListener('input', (e) => {
      const password = e.target.value
      if (password.length > 0) {
        const strength = authManager.checkPasswordStrength(password)
        passwordStrengthDiv.innerHTML = `
          <div class="strength-meter">
            <div class="strength-bar strength-${strength.score}"></div>
          </div>
          <span class="strength-text">Password strength: ${strength.level}</span>
        `
        passwordStrengthDiv.style.display = 'block'
      } else {
        passwordStrengthDiv.style.display = 'none'
      }
    })
  }
  
  // Password confirmation checker
  const passwordConfirmInput = document.getElementById('registerPasswordConfirm')
  const passwordMatchDiv = document.getElementById('passwordMatch')
  
  if (passwordConfirmInput && passwordMatchDiv) {
    passwordConfirmInput.addEventListener('input', (e) => {
      const password = document.getElementById('registerPassword').value
      const confirmPassword = e.target.value
      
      if (confirmPassword.length > 0) {
        if (password === confirmPassword) {
          passwordMatchDiv.innerHTML = '<span class="match-success">✓ Passwords match</span>'
          passwordMatchDiv.className = 'password-match success'
        } else {
          passwordMatchDiv.innerHTML = '<span class="match-error">✗ Passwords do not match</span>'
          passwordMatchDiv.className = 'password-match error'
        }
        passwordMatchDiv.style.display = 'block'
      } else {
        passwordMatchDiv.style.display = 'none'
      }
    })
  }
  
  // Real-time email validation
  const emailInputs = document.querySelectorAll('input[type="email"]')
  emailInputs.forEach(input => {
    input.addEventListener('blur', (e) => {
      const email = e.target.value.trim()
      if (email && !authManager.validationRules.email.pattern.test(email)) {
        e.target.classList.add('error')
      } else {
        e.target.classList.remove('error')
      }
    })
  })
  
  // Clear errors on input focus
  document.querySelectorAll('.form-input').forEach(input => {
    input.addEventListener('focus', (e) => {
      e.target.classList.remove('error')
      const errorId = e.target.id + 'Error'
      const errorElement = document.getElementById(errorId)
      if (errorElement) {
        errorElement.style.display = 'none'
      }
    })
  authManager.clearFormErrors()
  })
})

// Add parallax effect to particles
window.addEventListener('scroll', () => {
  authManager.clearFormErrors()
  const scrolled = window.pageYOffset
  const particles = document.querySelectorAll('.particle')
  
  // Clear form errors when switching tabs
  authManager.clearFormErrors()
  
  particles.forEach((particle, index) => {
    const speed = 0.5 + (index * 0.1)
    particle.style.transform = `translateY(${scrolled * speed}px)`
  })
})