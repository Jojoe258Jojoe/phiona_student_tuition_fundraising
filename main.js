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
window.loadCompetitions = loadCompetitions

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
    const email = document.getElementById('loginEmail').value
    const password = document.getElementById('loginPassword').value
    
    await authManager.login(email, password)
  })

  // Register form
  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    
    const submitButton = e.target.querySelector('button[type="submit"]')
    const originalText = submitButton.textContent
    
    // Show loading state
    submitButton.textContent = 'Creating Account...'
    submitButton.disabled = true
    
    const formData = {
      email: document.getElementById('registerEmail').value,
      password: document.getElementById('registerPassword').value,
      fullName: document.getElementById('registerFullName').value,
      school: document.getElementById('registerSchool').value,
      skills: document.getElementById('registerSkills').value
    }
    
    const success = await authManager.register(formData)
    if (success) {
      closeAuthModal()
      // Reload competitions to show user-specific data
      await loadCompetitions()
    }
    
    // Reset button state
    submitButton.textContent = originalText
    submitButton.disabled = false
  })

  // Forgot password form
  document.getElementById('forgotPasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    const email = document.getElementById('resetEmail').value
    
    const success = await authManager.resetPassword(email)
    if (success) {
      showTab('login')
    }
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

// Add parallax effect to particles
window.addEventListener('scroll', () => {
  const scrolled = window.pageYOffset
  const particles = document.querySelectorAll('.particle')
  
  particles.forEach((particle, index) => {
    const speed = 0.5 + (index * 0.1)
    particle.style.transform = `translateY(${scrolled * speed}px)`
  })
})