// ===== MOBILE MENU =====
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('active');
});

// Close menu when link clicked
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => navLinks.classList.remove('active'));
});

// ===== IMAGE SLIDER =====
const slides = document.getElementById('slides');
const totalSlides = document.querySelectorAll('.slide').length;
const dotsContainer = document.getElementById('dots');
let currentSlide = 0;

// Create dots
for (let i = 0; i < totalSlides; i++) {
  const dot = document.createElement('span');
  dot.classList.add('dot');
  if (i === 0) dot.classList.add('active');
  dot.addEventListener('click', () => goToSlide(i));
  dotsContainer.appendChild(dot);
}

function updateSlider() {
  slides.style.transform = `translateX(-${currentSlide * 100}%)`;
  document.querySelectorAll('.dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === currentSlide);
  });
}

function changeSlide(direction) {
  currentSlide = (currentSlide + direction + totalSlides) % totalSlides;
  updateSlider();
}

function goToSlide(index) {
  currentSlide = index;
  updateSlider();
}

// Auto-play slider
setInterval(() => changeSlide(1), 4000);

// ===== STAR RATING =====
const stars = document.querySelectorAll('.stars i');
let rating = 0;

stars.forEach(star => {
  star.addEventListener('click', () => {
    rating = star.getAttribute('data-value');
    stars.forEach(s => {
      s.classList.toggle('active', s.getAttribute('data-value') <= rating);
    });
  });
});

// ===== REVIEW FORM =====
// ===== REVIEW FORM WITH SUPABASE =====
document.getElementById('reviewForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  if (rating === 0) {
    alert('অনুগ্রহ করে রেটিং দিন');
    return;
  }
  
  const form = e.target;
  const name = form.querySelector('input[type="text"]').value;
  const mobile = form.querySelector('input[type="tel"]').value;
  const message = form.querySelector('textarea').value;
  const btn = form.querySelector('button');
  
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> পাঠানো হচ্ছে...';
  
  try {
    const { error } = await supabaseClient
      .from('reviews')
      .insert([{ name, mobile, rating: parseInt(rating), message }]);
    
    if (error) throw error;
    
    alert('ধন্যবাদ! আপনার মতামতের জন্য ❤️');
    form.reset();
    stars.forEach(s => s.classList.remove('active'));
    rating = 0;
  } catch (err) {
    alert('কিছু সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    console.error(err);
  }
  
  btn.disabled = false;
  btn.innerHTML = '<i class="fas fa-paper-plane"></i> পাঠিয়ে দিন';
});

// ===== NAVBAR SHADOW ON SCROLL =====
window.addEventListener('scroll', () => {
  const navbar = document.querySelector('.navbar');
  navbar.style.boxShadow = window.scrollY > 50 
    ? '0 4px 20px rgba(0,0,0,0.15)' 
    : '0 4px 20px rgba(0,0,0,0.08)';
});

