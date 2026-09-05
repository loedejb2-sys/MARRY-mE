function handleChoice(isYes) {
  const modal = document.getElementById('responseModal');
  const title = document.getElementById('modalTitle');
  const subtext = document.getElementById('modalSubtext');
  const emoji = document.getElementById('modalEmoji');

  if (isYes) {
    emoji.textContent = "🥰";
    title.textContent = "YYAYYYY I LOVEEE YOUUUU! ❤️✨";
    title.style.color = "#e91e63";
    subtext.textContent = "You've made me the happiest person in the universe! Here's to our forever together! 🥂✨";
    
    // Fire celebratory confetti explosion
    triggerConfetti();
  } else {
    emoji.textContent = "🥺";
    title.textContent = "I understand, my love.. 🤍";
    title.style.color = "#607d8b";
    subtext.textContent = "Thank you for sharing this beautiful moment with me under the sunset.";
  }

  modal.classList.add('active');
}

function closeModal() {
  document.getElementById('responseModal').classList.remove('active');
}

function triggerConfetti() {
  const count = 200;
  const defaults = { origin: { y: 0.7 } };

  function fire(particleRatio, opts) {
    confetti(Object.assign({}, defaults, opts, {
      particleCount: Math.floor(count * particleRatio)
    }));
  }

  fire(0.25, { spread: 26, startVelocity: 55, colors: ['#ffea00', '#ff4081', '#ffffff'] });
  fire(0.2, { spread: 60, colors: ['#ff9800', '#e91e63', '#fff'] });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, colors: ['#ffe066', '#ff4081', '#ab47bc'] });
  fire(0.1, { spread: 120, startVelocity: 45 });
}
