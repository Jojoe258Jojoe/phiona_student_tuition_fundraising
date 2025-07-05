export function createAuthModal() {
  return `
    <div class="auth-modal" id="authModal">
      <div class="modal-content">
        <span class="close-btn" onclick="closeAuthModal()">&times;</span>
        
        <div class="auth-tabs">
          <button class="tab-btn active" onclick="showTab('login')">Login</button>
          <button class="tab-btn" onclick="showTab('register')">Register</button>
        </div>

        <!-- Login Form -->
        <div id="loginTab" class="tab-content active">
          <h2>Welcome Back</h2>
          <form id="loginForm" class="auth-form" novalidate>
            <div class="form-group">
              <label for="loginEmail">Email Address *</label>
              <input 
                type="email" 
                id="loginEmail" 
                name="email"
                required 
                autocomplete="email"
                placeholder="Enter your email address"
                class="form-input"
              >
              <span class="field-error" id="loginEmailError"></span>
            </div>
            
            <div class="form-group">
              <label for="loginPassword">Password *</label>
              <div class="password-input-container">
                <input 
                  type="password" 
                  id="loginPassword" 
                  name="password"
                  required 
                  autocomplete="current-password"
                  placeholder="Enter your password"
                  minlength="6"
                  class="form-input"
                >
                <button type="button" class="password-toggle" onclick="togglePassword('loginPassword')">
                  <span class="toggle-icon">👁️</span>
                </button>
              </div>
              <span class="field-error" id="loginPasswordError"></span>
            </div>
            
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" id="loginSubmitBtn">
                <span class="btn-text">Sign In</span>
                <span class="btn-loading" style="display: none;">
                  <span class="spinner"></span>
                  Signing in...
                </span>
              </button>
            </div>
            
            <p class="forgot-password">
              <a href="#" onclick="showForgotPassword()">Forgot your password?</a>
            </p>
          </form>
        </div>

        <!-- Register Form -->
        <div id="registerTab" class="tab-content">
          <h2>Create Your Account</h2>
          <p class="form-subtitle">Join thousands of students earning through competitions</p>
          
          <form id="registerForm" class="auth-form" novalidate>
            <div class="form-group">
              <label for="registerName">Full Name *</label>
              <input 
                type="text" 
                id="registerName" 
                name="name"
                required 
                autocomplete="name"
                placeholder="Enter your full name"
                minlength="2"
                maxlength="100"
                pattern="^[a-zA-Z\\s\\-'.]+$"
                class="form-input"
              >
              <span class="field-error" id="registerNameError"></span>
              <span class="field-help">Enter your first and last name</span>
            </div>

            <div class="form-group">
              <label for="registerEmail">Email Address *</label>
              <input 
                type="email" 
                id="registerEmail" 
                name="email"
                required 
                autocomplete="email"
                placeholder="Enter your email address"
                maxlength="255"
                class="form-input"
              >
              <span class="field-error" id="registerEmailError"></span>
              <span class="field-help">We'll use this to send you competition updates</span>
            </div>

            <div class="form-group">
              <label for="registerSchoolUniversity">School/University *</label>
              <input 
                type="text" 
                id="registerSchoolUniversity" 
                name="schoolUniversity"
                required 
                placeholder="Enter your school or university name"
                minlength="2"
                maxlength="150"
                class="form-input"
              >
              <span class="field-error" id="registerSchoolError"></span>
              <span class="field-help">Your current educational institution</span>
            </div>

            <div class="form-group">
              <label for="registerSkills">Technical Skills *</label>
              <input 
                type="text" 
                id="registerSkills" 
                name="skills"
                required 
                placeholder="e.g., Python, JavaScript, UI/UX Design, Data Science"
                maxlength="500"
                class="form-input"
              >
              <span class="field-error" id="registerSkillsError"></span>
              <span class="field-help">List your technical skills separated by commas</span>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="registerPassword">Password *</label>
                <div class="password-input-container">
                  <input 
                    type="password" 
                    id="registerPassword" 
                    name="password"
                    required 
                    autocomplete="new-password"
                    placeholder="Create a strong password"
                    minlength="6"
                    maxlength="128"
                    class="form-input"
                  >
                  <button type="button" class="password-toggle" onclick="togglePassword('registerPassword')">
                    <span class="toggle-icon">👁️</span>
                  </button>
                </div>
                <span class="field-error" id="registerPasswordError"></span>
                <div class="password-strength" id="passwordStrength"></div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="registerPasswordConfirm">Confirm Password *</label>
                <div class="password-input-container">
                  <input 
                    type="password" 
                    id="registerPasswordConfirm" 
                    name="passwordConfirmation"
                    required 
                    autocomplete="new-password"
                    placeholder="Confirm your password"
                    minlength="6"
                    maxlength="128"
                    class="form-input"
                  >
                  <button type="button" class="password-toggle" onclick="togglePassword('registerPasswordConfirm')">
                    <span class="toggle-icon">👁️</span>
                  </button>
                </div>
                <span class="field-error" id="registerPasswordConfirmError"></span>
                <span class="password-match" id="passwordMatch"></span>
              </div>
            </div>

            <div class="form-group">
              <label class="checkbox-container">
                <input type="checkbox" id="agreeTerms" name="agreeTerms" required>
                <span class="checkmark"></span>
                I agree to the <a href="terms.html" target="_blank">Terms of Service</a> and <a href="privacy.html" target="_blank">Privacy Policy</a> *
              </label>
              <span class="field-error" id="agreeTermsError"></span>
            </div>
            
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" id="registerSubmitBtn">
                <span class="btn-text">Create Account</span>
                <span class="btn-loading" style="display: none;">
                  <span class="spinner"></span>
                  Creating account...
                </span>
              </button>
            </div>
            
            <p class="registration-note">
              <small>Your account will be created instantly - no email verification required!</small>
            </p>
          </form>
        </div>

        <!-- Forgot Password Form -->
        <div id="forgotPasswordTab" class="tab-content">
          <h2>Reset Password</h2>
          <p class="form-subtitle">Enter your email address and we'll send you a reset link</p>
          
          <form id="forgotPasswordForm" class="auth-form" novalidate>
            <div class="form-group">
              <label for="resetEmail">Email Address *</label>
              <input 
                type="email" 
                id="resetEmail" 
                name="email"
                required 
                autocomplete="email"
                placeholder="Enter your email address"
                class="form-input"
              >
              <span class="field-error" id="resetEmailError"></span>
            </div>
            
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" id="resetSubmitBtn">
                <span class="btn-text">Send Reset Link</span>
                <span class="btn-loading" style="display: none;">
                  <span class="spinner"></span>
                  Sending...
                </span>
              </button>
            </div>
            
            <p class="back-to-login">
              <a href="#" onclick="showTab('login')">Back to Login</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  `
}

export function createUserProfile() {
  return `
    <div class="user-profile">
      <div class="user-avatar">
        <img src="https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&dpr=1" alt="User">
      </div>
      <div class="user-info">
        <span class="user-email"></span>
        <div class="user-dropdown">
          <a href="profile.html">Profile</a>
          <a href="#" onclick="authManager.logout()">Logout</a>
        </div>
      </div>
    </div>
  `
}

export function createEmailVerificationBanner() {
  return `
    <div class="email-verification-banner">
      <p>Please verify your email address to access all features.</p>
      <button class="btn btn-small" onclick="resendVerification()">Resend Email</button>
    </div>
  `
}