// Wait until the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
    const contactForm = document.getElementById("contactForm");

    // Handle form submission
    contactForm.addEventListener("submit", async (event) => {
        event.preventDefault(); // Prevent page reload

        // Collect form data
        const formData = {
            name: document.getElementById("name").value.trim(),
            email: document.getElementById("email").value.trim(),
            message: document.getElementById("message").value.trim()
        };

        try {
            // Send data to backend
            const response = await fetch("http://localhost:5000/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            // Show success message
            alert("✅ " + result.message);

            // Reset form after successful submission
            contactForm.reset();
        } catch (error) {
            // Show error message
            alert("❌ An error occurred while sending your message. Please try again later.");
            console.error("Error:", error);
        }
    });
});