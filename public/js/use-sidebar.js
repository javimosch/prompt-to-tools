import { onMounted, onUnmounted } from '/lib/vue.esm-browser.prod.js';

export function useSidebar() {

    console.log('use-sidebar');

  function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('open');
  }

  onMounted(() => {
    console.log('use-sidebar mounted');
    document.addEventListener('keydown', handleKeyDown);
    const sidebar = document.querySelector('.sidebar');
    sidebar.addEventListener('click', handleClick);
  });

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown);
    const sidebar = document.querySelector('.sidebar');
    sidebar.removeEventListener('click', handleClick);
  });

  function handleKeyDown(event) {
    if (event.ctrlKey && event.code === 'Space') {
      toggleSidebar();
    }
  }

  function handleClick() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar.classList.contains('open')) {
      toggleSidebar();
    }
  }
}
