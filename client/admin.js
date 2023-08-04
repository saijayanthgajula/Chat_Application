// script.js

// Hamburger menu toggle
const burger = document.querySelector('.burger');
const navLinks = document.querySelector('.nav-links');
const sidebar = document.querySelector('.sidebar');

burger.addEventListener('click', () => {
    burger.classList.toggle('active');
    navLinks.classList.toggle('active');
    sidebar.classList.toggle('active');
});

// Active link highlighting
const sidebarLinks = document.querySelectorAll('.sidebar-links a');
const navLinksArray = Array.from(document.querySelectorAll('.nav-links a'));

sidebarLinks.forEach((link) => {
    link.addEventListener('click', () => {
        sidebarLinks.forEach((link) => link.classList.remove('active'));
        link.classList.add('active');
        sidebar.classList.remove('active'); // Close sidebar after clicking a link
    });
});

navLinksArray.forEach((link) => {
    link.addEventListener('click', () => {
        navLinksArray.forEach((link) => link.classList.remove('active'));
        link.classList.add('active');
        sidebar.classList.remove('active'); // Close sidebar after clicking a link
    });
});