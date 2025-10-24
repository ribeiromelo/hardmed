// Custom Modal System - Replace all alert() and confirm()

// Create modal HTML structure if it doesn't exist
function initModalSystem() {
  if (document.getElementById('customModalOverlay')) return;
  
  const modalHTML = `
    <div id="customModalOverlay" class="hidden fixed inset-0 bg-black bg-opacity-75 z-[9999] flex items-center justify-center p-4">
      <div id="customModalContainer" class="bg-gray-800 rounded-2xl max-w-md w-full p-8 border border-gray-700 shadow-2xl transform transition-all">
        <div id="customModalIcon" class="text-center mb-4"></div>
        <h3 id="customModalTitle" class="text-2xl font-bold text-center mb-4"></h3>
        <p id="customModalMessage" class="text-gray-300 text-center mb-6"></p>
        <div id="customModalButtons" class="flex gap-4"></div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Show alert modal
window.showAlert = function(message, title = 'Aviso', type = 'info') {
  initModalSystem();
  
  const overlay = document.getElementById('customModalOverlay');
  const icon = document.getElementById('customModalIcon');
  const titleEl = document.getElementById('customModalTitle');
  const messageEl = document.getElementById('customModalMessage');
  const buttons = document.getElementById('customModalButtons');
  
  // Set icon based on type
  let iconHTML = '';
  switch(type) {
    case 'success':
      iconHTML = '<i class="fas fa-check-circle text-6xl text-green-500"></i>';
      break;
    case 'error':
      iconHTML = '<i class="fas fa-times-circle text-6xl text-red-500"></i>';
      break;
    case 'warning':
      iconHTML = '<i class="fas fa-exclamation-triangle text-6xl text-yellow-500"></i>';
      break;
    default:
      iconHTML = '<i class="fas fa-info-circle text-6xl text-blue-500"></i>';
  }
  
  icon.innerHTML = iconHTML;
  titleEl.textContent = title;
  messageEl.textContent = message;
  
  buttons.innerHTML = `
    <button onclick="hideCustomModal()" class="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition font-semibold">
      OK
    </button>
  `;
  
  overlay.classList.remove('hidden');
  
  // Close on ESC key
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      hideCustomModal();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}

// Show confirm modal
window.showConfirm = function(message, title = 'Confirmação', options = {}) {
  initModalSystem();
  
  return new Promise((resolve) => {
    const overlay = document.getElementById('customModalOverlay');
    const icon = document.getElementById('customModalIcon');
    const titleEl = document.getElementById('customModalTitle');
    const messageEl = document.getElementById('customModalMessage');
    const buttons = document.getElementById('customModalButtons');
    
    const confirmText = options.confirmText || 'Confirmar';
    const cancelText = options.cancelText || 'Cancelar';
    const isDangerous = options.dangerous || false;
    
    icon.innerHTML = '<i class="fas fa-question-circle text-6xl text-yellow-500"></i>';
    titleEl.textContent = title;
    messageEl.textContent = message;
    
    const confirmBtnClass = isDangerous 
      ? 'bg-red-600 hover:bg-red-700' 
      : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700';
    
    buttons.innerHTML = `
      <button id="modalCancelBtn" class="flex-1 bg-gray-700 py-3 rounded-lg hover:bg-gray-600 transition font-semibold">
        ${cancelText}
      </button>
      <button id="modalConfirmBtn" class="flex-1 ${confirmBtnClass} py-3 rounded-lg transition font-semibold">
        ${confirmText}
      </button>
    `;
    
    overlay.classList.remove('hidden');
    
    // Handle confirm
    document.getElementById('modalConfirmBtn').onclick = () => {
      hideCustomModal();
      resolve(true);
    };
    
    // Handle cancel
    document.getElementById('modalCancelBtn').onclick = () => {
      hideCustomModal();
      resolve(false);
    };
    
    // Close on ESC key (cancel)
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        hideCustomModal();
        resolve(false);
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  });
}

// Hide modal
window.hideCustomModal = function() {
  const overlay = document.getElementById('customModalOverlay');
  if (overlay) {
    overlay.classList.add('hidden');
  }
}

// Show loading modal
window.showLoading = function(message = 'Carregando...') {
  initModalSystem();
  
  const overlay = document.getElementById('customModalOverlay');
  const icon = document.getElementById('customModalIcon');
  const titleEl = document.getElementById('customModalTitle');
  const messageEl = document.getElementById('customModalMessage');
  const buttons = document.getElementById('customModalButtons');
  
  icon.innerHTML = '<i class="fas fa-spinner fa-spin text-6xl text-purple-500"></i>';
  titleEl.textContent = '';
  messageEl.textContent = message;
  buttons.innerHTML = '';
  
  overlay.classList.remove('hidden');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initModalSystem();
});
