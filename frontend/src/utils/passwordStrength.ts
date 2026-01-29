export interface PasswordStrength {
  score: 0 | 1 | 2 | 3;
  label: 'Weak' | 'Medium' | 'Strong';
  color: '#ef4444' | '#f59e0b' | '#10b981';
}

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password || password.length === 0) {
    return { score: 0, label: 'Weak', color: '#ef4444' };
  }

  let score = 0;

  // Length check
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;

  // Character variety checks
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  // Determine strength based on score
  if (score <= 2) {
    return { score: 0, label: 'Weak', color: '#ef4444' };
  } else if (score <= 4) {
    return { score: 1, label: 'Medium', color: '#f59e0b' };
  } else {
    // Strong requires all checks plus length >= 10
    if (password.length >= 10 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) {
      return { score: 3, label: 'Strong', color: '#10b981' };
    }
    return { score: 2, label: 'Medium', color: '#f59e0b' };
  }
}

