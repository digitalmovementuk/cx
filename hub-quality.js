document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('#faq .faq').forEach((faq) => {
    faq.querySelectorAll('details').forEach((item) => {
      item.querySelector('summary')?.addEventListener('click', () => {
        if (item.open) return;
        faq.querySelectorAll('details[open]').forEach((openItem) => {
          if (openItem !== item) openItem.open = false;
        });
      });
    });
  });
});
