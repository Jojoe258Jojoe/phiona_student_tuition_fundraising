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
          <form id="loginForm" class="auth-form">
            <div class="form-group">
              <label for="loginEmail">Email</label>
              <input type="email" id="loginEmail" required>
            </div>
            <div class="form-group">
              <label for="loginPassword">Password</label>
              <input type="password" id="loginPassword" required>
            </div>
            <button type="submit" class="btn btn-primary">Login</button>
            <p class="forgot-password">
              <a href="#" onclick="showForgotPassword()">Forgot Password?</a>
            </p>
          </form>
        </div>

        <!-- Register Form -->
        <div id="registerTab" class="tab-content">
          <h2>Join CompeteEarn</h2>
          <form id="registerForm" class="auth-form">
            <div class="form-group">
              <label for="registerFullName">Full Name</label>
              <input type="text" id="registerFullName" required>
            </div>
            <div class="form-group">
              <label for="registerEmail">Email</label>
              <input type="email" id="registerEmail" required>
            </div>
            <div class="form-group">
              <label for="registerPassword">Password</label>
              <input type="password" id="registerPassword" required minlength="6">
            </div>
            <div class="form-group">
              <label for="registerSchool">School/University</label>
              <input type="text" id="registerSchool" required>
            </div>
            <div class="form-group">
              <label for="registerSkills">Skills (comma-separated)</label>
              <input type="text" id="registerSkills" placeholder="e.g., JavaScript, Python, Design">
            </div>
            <button type="submit" class="btn btn-primary">Create Account</button>
          </form>
        </div>

        <!-- Forgot Password Form -->
        <div id="forgotPasswordTab" class="tab-content">
          <h2>Reset Password</h2>
          <form id="forgotPasswordForm" class="auth-form">
            <div class="form-group">
              <label for="resetEmail">Email</label>
              <input type="email" id="resetEmail" required>
            </div>
            <button type="submit" class="btn btn-primary">Send Reset Link</button>
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
          <a href="#" onclick="showProfile()">Profile</a>
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