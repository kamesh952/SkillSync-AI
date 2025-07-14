// script.js
document.addEventListener('DOMContentLoaded', () => {
    // File Upload Handler
    const fileUploadWrapper = document.getElementById('fileUploadWrapper');
    const resumeFileInput = document.getElementById('resumeFile');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = fileInfo.querySelector('.file-name');
    const fileSize = fileInfo.querySelector('.file-size');

    // Form Elements
    const analyzerForm = document.getElementById('analyzerForm');
    const jobDescriptionTextarea = document.getElementById('jobDescription');
    const charCount = document.getElementById('charCount');
    const loadingContainer = document.getElementById('loadingContainer');
    const resultsContainer = document.getElementById('resultsContainer');
    const resultsContent = document.getElementById('resultsContent');
    const matchScoreElement = document.getElementById('matchScore');

    // Analysis content containers
    const strengthsContent = document.getElementById('strengthsContent');
    const weaknessesContent = document.getElementById('weaknessesContent');
    const recommendationsContent = document.getElementById('recommendationsContent');

    // Initialize file upload handling
    setupFileUpload();

    // Initialize form submission
    setupFormSubmission();

    // Initialize character counter
    setupCharacterCounter();

    // Helper functions
    function setupFileUpload() {
        // Click to upload
        fileUploadWrapper.addEventListener('click', () => {
            resumeFileInput.click();
        });

        // File change handler
        resumeFileInput.addEventListener('change', (e) => {
            handleFile(e.target.files[0]);
        });

        // Drag and drop handlers
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            fileUploadWrapper.addEventListener(eventName, preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            fileUploadWrapper.addEventListener(eventName, () => {
                fileUploadWrapper.classList.add('dragover');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            fileUploadWrapper.addEventListener(eventName, () => {
                fileUploadWrapper.classList.remove('dragover');
            }, false);
        });

        fileUploadWrapper.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFile(files[0]);
            }
        }, false);

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        function handleFile(file) {
            if (file) {
                if (file.type !== 'application/pdf') {
                    showError('Only PDF files are allowed');
                    return;
                }

                if (file.size > 5 * 1024 * 1024) {
                    showError('File size exceeds 5MB limit');
                    return;
                }

                fileName.textContent = file.name;
                fileSize.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
                fileInfo.classList.add('show');
            }
        }
    }

    function setupFormSubmission() {
        analyzerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!resumeFileInput.files[0]) {
                showError('Please upload your resume');
                return;
            }

            if (!jobDescriptionTextarea.value.trim()) {
                showError('Please enter the job description');
                return;
            }

            try {
                showLoading();
                
                const formData = new FormData();
                formData.append('resume', resumeFileInput.files[0]);
                formData.append('jobDescription', jobDescriptionTextarea.value);

                const response = await fetch('http://localhost:3001/api/analyze', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || 'Failed to analyze resume');
                }

                const data = await response.json();
                showResults(data.result, data.matchScore, data.sections);
            } catch (error) {
                console.error('Analysis error:', error);
                showError(error.message || 'An unexpected error occurred');
                hideLoading();
            }
        });
    }

    function setupCharacterCounter() {
        jobDescriptionTextarea.addEventListener('input', () => {
            charCount.textContent = jobDescriptionTextarea.value.length.toLocaleString();
        });
    }

    function showLoading() {
        loadingContainer.classList.add('show');
        resultsContainer.classList.remove('show');
        loadingContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function hideLoading() {
        loadingContainer.classList.remove('show');
    }

    function showResults(analysisHTML, matchScore, sections) {
        // Set the main analysis content
        resultsContent.innerHTML = processAnalysisContent(analysisHTML);
        
        // Set match score
        matchScoreElement.textContent = matchScore || 'N/A';
        
        // Populate individual sections if provided
        if (sections) {
            if (sections.strengths) {
                strengthsContent.innerHTML = processAnalysisContent(sections.strengths);
            }
            if (sections.weaknesses) {
                weaknessesContent.innerHTML = processAnalysisContent(sections.weaknesses);
            }
            if (sections.recommendations) {
                recommendationsContent.innerHTML = processAnalysisContent(sections.recommendations);
            }
        }
        
        hideLoading();
        resultsContainer.classList.add('show');
        
        // Add animation to results
        setTimeout(() => {
            resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            animateResults();
        }, 100);
    }

    function processAnalysisContent(content) {
        if (!content) return '';
        
        // Add special styling classes for different types of content
        let processedContent = content;
        
        // Add highlight classes for important information
        processedContent = processedContent.replace(
            /<p><strong>Important:<\/strong>(.*?)<\/p>/gi,
            '<div class="highlight"><strong>Important:</strong>$1</div>'
        );
        
        processedContent = processedContent.replace(
            /<p><strong>Warning:<\/strong>(.*?)<\/p>/gi,
            '<div class="warning"><strong>Warning:</strong>$1</div>'
        );
        
        processedContent = processedContent.replace(
            /<p><strong>Recommendation:<\/strong>(.*?)<\/p>/gi,
            '<div class="success"><strong>Recommendation:</strong>$1</div>'
        );
        
        // Enhance list items with better styling
        processedContent = processedContent.replace(
            /<li><strong>(.*?)<\/strong>:(.*?)<\/li>/gi,
            '<li><strong>$1:</strong><span style="color: rgba(248, 249, 250, 0.9);">$2</span></li>'
        );
        
        return processedContent;
    }

    function animateResults() {
        const analysisCards = document.querySelectorAll('.analysis-card');
        const fullAnalysis = document.querySelector('.full-analysis');
        
        analysisCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.6s ease-out';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 200);
        });
        
        setTimeout(() => {
            fullAnalysis.style.opacity = '0';
            fullAnalysis.style.transform = 'translateY(20px)';
            fullAnalysis.style.transition = 'all 0.6s ease-out';
            
            setTimeout(() => {
                fullAnalysis.style.opacity = '1';
                fullAnalysis.style.transform = 'translateY(0)';
            }, 100);
        }, analysisCards.length * 200 + 200);
    }

    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(239, 68, 68, 0.9);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            z-index: 10000;
            font-family: 'Outfit', sans-serif;
            font-weight: 500;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(239, 68, 68, 0.3);
            backdrop-filter: blur(10px);
        `;
        errorDiv.textContent = message;
        
        document.body.appendChild(errorDiv);
        
        // Add entrance animation
        setTimeout(() => {
            errorDiv.style.animation = 'slideInDown 0.3s ease-out';
        }, 10);
        
        // Remove after 5 seconds with exit animation
        setTimeout(() => {
            errorDiv.style.animation = 'slideOutUp 0.3s ease-out';
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.remove();
                }
            }, 300);
        }, 5000);
    }

    // Add CSS animations for error messages
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideOutUp {
            from {
                transform: translateY(0);
                opacity: 1;
            }
            to {
                transform: translateY(-100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    // Enhanced form validation
    function validateForm() {
        const file = resumeFileInput.files[0];
        const jobDescription = jobDescriptionTextarea.value.trim();
        
        if (!file) {
            showError('Please upload your resume (PDF format only)');
            return false;
        }
        
        if (file.type !== 'application/pdf') {
            showError('Only PDF files are supported');
            return false;
        }
        
        if (file.size > 5 * 1024 * 1024) {
            showError('File size must be less than 5MB');
            return false;
        }
        
        if (!jobDescription) {
            showError('Please enter the job description');
            return false;
        }
        
        if (jobDescription.length < 50) {
            showError('Job description seems too short. Please provide a more detailed description.');
            return false;
        }
        
        return true;
    }

    // Add real-time validation feedback
    resumeFileInput.addEventListener('change', () => {
        const file = resumeFileInput.files[0];
        if (file) {
            if (file.type !== 'application/pdf') {
                showError('Only PDF files are allowed');
                resumeFileInput.value = '';
                fileInfo.classList.remove('show');
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) {
                showError('File size exceeds 5MB limit');
                resumeFileInput.value = '';
                fileInfo.classList.remove('show');
                return;
            }
        }
    });

    // Enhanced character counter with color coding
    jobDescriptionTextarea.addEventListener('input', () => {
        const length = jobDescriptionTextarea.value.length;
        charCount.textContent = length.toLocaleString();
        
        // Color code based on length
        if (length < 50) {
            charCount.style.color = '#f72585'; // Red for too short
        } else if (length < 200) {
            charCount.style.color = '#ffd60a'; // Yellow for short
        } else {
            charCount.style.color = '#4cc9f0'; // Blue for good length
        }
    });

    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + Enter to submit form
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            if (validateForm()) {
                analyzerForm.dispatchEvent(new Event('submit'));
            }
        }
        
        // Escape to clear form
        if (e.key === 'Escape') {
            if (confirm('Clear all data and start over?')) {
                analyzerForm.reset();
                fileInfo.classList.remove('show');
                resultsContainer.classList.remove('show');
                charCount.textContent = '0';
                charCount.style.color = '#6c757d';
            }
        }
    });

    // Add tooltips for better UX
    function addTooltips() {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.style.cssText = `
            position: absolute;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            font-size: 0.8rem;
            font-family: 'Outfit', sans-serif;
            z-index: 10001;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s ease;
            max-width: 200px;
            text-align: center;
        `;
        document.body.appendChild(tooltip);

        // Add tooltip to file upload
        fileUploadWrapper.addEventListener('mouseenter', (e) => {
            tooltip.textContent = 'Upload your resume in PDF format (max 5MB)';
            tooltip.style.opacity = '1';
        });

        fileUploadWrapper.addEventListener('mouseleave', () => {
            tooltip.style.opacity = '0';
        });

        fileUploadWrapper.addEventListener('mousemove', (e) => {
            tooltip.style.left = e.pageX + 10 + 'px';
            tooltip.style.top = e.pageY - 40 + 'px';
        });
    }

    // Initialize tooltips
    addTooltips();

    // Add progress indicator for file upload
    function showUploadProgress() {
        const progressBar = document.createElement('div');
        progressBar.className = 'upload-progress';
        progressBar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: rgba(67, 97, 238, 0.3);
            z-index: 10000;
        `;
        
        const progressFill = document.createElement('div');
        progressFill.style.cssText = `
            height: 100%;
            background: linear-gradient(90deg, var(--primary), var(--success));
            width: 0%;
            transition: width 0.3s ease;
        `;
        
        progressBar.appendChild(progressFill);
        document.body.appendChild(progressBar);
        
        // Simulate progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 30;
            if (progress > 90) progress = 90;
            progressFill.style.width = progress + '%';
        }, 200);
        
        return {
            complete: () => {
                clearInterval(interval);
                progressFill.style.width = '100%';
                setTimeout(() => {
                    progressBar.remove();
                }, 500);
            }
        };
    }

    // Enhanced form submission with progress
    analyzerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;
        
        const progress = showUploadProgress();
        
        try {
            showLoading();
            
            const formData = new FormData();
            formData.append('resume', resumeFileInput.files[0]);
            formData.append('jobDescription', jobDescriptionTextarea.value);

            const response = await fetch('https://skillsync-ai-2-i3jw.onrender.com/', {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            progress.complete();

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to analyze resume');
            }

            const data = await response.json();
            showResults(data.result, data.matchScore, data.sections);
        } catch (error) {
            progress.complete();
            console.error('Analysis error:', error);
            showError(error.message || 'An unexpected error occurred');
            hideLoading();
        }
    });
});
