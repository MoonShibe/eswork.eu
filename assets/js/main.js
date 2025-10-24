(() => {
    const translations = window.ESW_TRANSLATIONS || {};
    const DEFAULT_LANG = 'de';
    const LANG_STORAGE_KEY = 'esw-preferred-language';
    const LEAD_STORAGE_KEY = 'esw-lead-dismissed';
    const html = document.documentElement;
    const body = document.body;

    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    const revealElements = document.querySelectorAll('[data-reveal]');
    const videoPlaceholders = document.querySelectorAll('[data-video-placeholder]');
    const languageSwitchers = document.querySelectorAll('[data-language-switcher]');
    const modalBackdrop = document.getElementById('modal-backdrop');
    const modal = document.getElementById('form-modal');
    const modalTitle = document.getElementById('form-modal-title');
    const modalMessage = document.getElementById('form-modal-message');
    const modalButton = document.getElementById('form-modal-button');
    const requestForm = document.getElementById('requestForm');
    const emailInput = document.getElementById('email');
    const emailError = document.getElementById('email-error');
    const leadCapture = document.getElementById('lead-capture');
    const leadForm = document.getElementById('callbackForm');
    const leadCloseTriggers = leadCapture ? leadCapture.querySelectorAll('[data-lead-close]') : [];

    const metaDescription = document.querySelector('meta[name="description"]');
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');
    const ogLocale = document.querySelector('meta[property="og:locale"]');
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    const twitterDescription = document.querySelector('meta[name="twitter:description"]');

    const localeMap = {
        de: 'de_DE',
        en: 'en_GB',
        ru: 'ru_RU',
        lv: 'lv_LV'
    };

    const safeSession = {
        get(key) {
            try {
                return window.sessionStorage.getItem(key);
            } catch (error) {
                return null;
            }
        },
        set(key, value) {
            try {
                window.sessionStorage.setItem(key, value);
            } catch (error) {
                // ignore
            }
        }
    };

    const safeLocal = {
        get(key) {
            try {
                return window.localStorage.getItem(key);
            } catch (error) {
                return null;
            }
        },
        set(key, value) {
            try {
                window.localStorage.setItem(key, value);
            } catch (error) {
                // ignore
            }
        }
    };

    let currentLang = DEFAULT_LANG;
    let leadTimer = null;
    let activeElementBeforeModal = null;
    let leadActiveFocus = null;

    const copy = (key) => {
        const langPack = translations[currentLang] || translations[DEFAULT_LANG] || {};
        if (Object.prototype.hasOwnProperty.call(langPack, key)) {
            return langPack[key];
        }
        const fallbackPack = translations[DEFAULT_LANG] || {};
        if (Object.prototype.hasOwnProperty.call(fallbackPack, key)) {
            return fallbackPack[key];
        }
        return '';
    };

    const setElementContent = (element, value) => {
        if (!element || typeof value !== 'string' || value.length === 0) {
            return;
        }

        if (value.includes('<')) {
            if (element.innerHTML !== value) {
                element.innerHTML = value;
            }
        } else if (element.textContent !== value) {
            element.textContent = value;
        }
    };

    const updateLanguageButtons = (lang) => {
        languageSwitchers.forEach((switcher) => {
            switcher.querySelectorAll('.language-option').forEach((button) => {
                const isActive = button.dataset.lang === lang;
                button.classList.toggle('active', isActive);
                button.setAttribute('aria-pressed', String(isActive));
            });
        });
    };

    const applyTranslationsToElements = () => {
        document.querySelectorAll('[data-l10n]').forEach((element) => {
            const key = element.dataset.l10n;
            const value = copy(key);
            setElementContent(element, value);
        });

        document.querySelectorAll('[data-l10n-placeholder]').forEach((element) => {
            const key = element.dataset.l10nPlaceholder;
            const value = copy(key);
            if (value && element.getAttribute('placeholder') !== value) {
                element.setAttribute('placeholder', value);
            }
        });

        document.querySelectorAll('[data-l10n-value]').forEach((element) => {
            const key = element.dataset.l10nValue;
            const value = copy(key);
            if (value && element.value !== value) {
                element.value = value;
            }
        });

        document.querySelectorAll('[data-l10n-aria-label]').forEach((element) => {
            const key = element.dataset.l10nAriaLabel;
            const value = copy(key);
            if (value && element.getAttribute('aria-label') !== value) {
                element.setAttribute('aria-label', value);
            }
        });
    };

    const applyLanguage = (lang, { persist = true } = {}) => {
        if (!translations[lang]) {
            lang = DEFAULT_LANG;
        }

        currentLang = lang;
        html.lang = lang;
        updateLanguageButtons(lang);

        const locale = localeMap[lang] || localeMap[DEFAULT_LANG];
        if (ogLocale) {
            ogLocale.setAttribute('content', locale);
        }

        const langPack = translations[lang];
        if (langPack.metaTitle) {
            document.title = langPack.metaTitle;
            if (ogTitle) {
                ogTitle.setAttribute('content', langPack.metaTitle);
            }
            if (twitterTitle) {
                twitterTitle.setAttribute('content', langPack.metaTitle);
            }
        }

        if (langPack.metaDescription) {
            if (metaDescription) {
                metaDescription.setAttribute('content', langPack.metaDescription);
            }
            if (ogDescription) {
                ogDescription.setAttribute('content', langPack.ogDescription || langPack.metaDescription);
            }
            if (twitterDescription) {
                twitterDescription.setAttribute('content', langPack.twitterDescription || langPack.metaDescription);
            }
        }

        applyTranslationsToElements();

        if (persist) {
            safeLocal.set(LANG_STORAGE_KEY, lang);
        }

        if (emailInput && emailInput.classList.contains('is-invalid')) {
            const trimmed = emailInput.value.trim();
            updateEmailErrorMessage(trimmed, { allowEmpty: trimmed.length === 0 });
        }
    };

    const detectInitialLanguage = () => {
        const stored = safeLocal.get(LANG_STORAGE_KEY);
        if (stored && translations[stored]) {
            return stored;
        }
        return DEFAULT_LANG;
    };

    languageSwitchers.forEach((switcher) => {
        switcher.querySelectorAll('.language-option').forEach((button) => {
            button.addEventListener('click', () => {
                const selected = button.dataset.lang;
                if (selected) {
                    applyLanguage(selected);
                }
            });
        });
    });

    const observer = 'IntersectionObserver' in window
        ? new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.2,
            rootMargin: '0px 0px -10% 0px'
        })
        : null;

    if (observer) {
        revealElements.forEach((element) => observer.observe(element));
    } else {
        revealElements.forEach((element) => element.classList.add('is-visible'));
    }

    if (navToggle && navLinks) {
        const collapseButtons = navLinks.querySelectorAll('[data-nav-collapse]');

        const closeNav = () => {
            navLinks.classList.remove('active');
            navToggle.setAttribute('aria-expanded', 'false');
        };

        navToggle.addEventListener('click', () => {
            const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
            navToggle.setAttribute('aria-expanded', String(!isExpanded));
            navLinks.classList.toggle('active');
        });

        navLinks.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', closeNav);
        });

        collapseButtons.forEach((button) => {
            button.addEventListener('click', closeNav);
        });
    }

    const openModal = ({ title, message, isError = false, ctaText = copy('modal_success_cta') }) => {
        if (!modal || !modalBackdrop || !modalTitle || !modalMessage || !modalButton) {
            return;
        }

        activeElementBeforeModal = document.activeElement;
        modal.classList.toggle('form-modal--error', Boolean(isError));
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modalButton.textContent = ctaText;

        modal.removeAttribute('hidden');
        modalBackdrop.removeAttribute('hidden');
        body.classList.add('modal-open');

        requestAnimationFrame(() => {
            modal.classList.add('active');
            modalBackdrop.classList.add('active');
            modalButton.focus({ preventScroll: true });
        });
    };

    const closeModal = () => {
        if (!modal || !modalBackdrop) {
            return;
        }

        modal.classList.remove('active');
        modalBackdrop.classList.remove('active');

        const finalize = () => {
            modal.setAttribute('hidden', '');
            modalBackdrop.setAttribute('hidden', '');
            if (!leadCapture || !leadCapture.classList.contains('is-visible')) {
                body.classList.remove('modal-open');
            }
            if (activeElementBeforeModal && typeof activeElementBeforeModal.focus === 'function') {
                activeElementBeforeModal.focus({ preventScroll: true });
            }
            activeElementBeforeModal = null;
        };

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            finalize();
        } else {
            window.setTimeout(finalize, 300);
        }
    };

    if (modalButton) {
        modalButton.addEventListener('click', closeModal);
    }

    if (modalBackdrop) {
        modalBackdrop.addEventListener('click', closeModal);
    }

    const cancelLeadTimer = () => {
        if (leadTimer) {
            window.clearTimeout(leadTimer);
            leadTimer = null;
        }
    };

    const showLeadCapture = () => {
        if (!leadCapture || leadCapture.classList.contains('is-visible')) {
            return;
        }

        cancelLeadTimer();
        leadActiveFocus = document.activeElement;
        leadCapture.removeAttribute('hidden');

        requestAnimationFrame(() => {
            leadCapture.classList.add('is-visible');
            body.classList.add('modal-open');
            const focusTarget = leadCapture.querySelector('input, select, textarea, button');
            if (focusTarget) {
                focusTarget.focus({ preventScroll: true });
            }
        });
    };

    const hideLeadCapture = () => {
        if (!leadCapture) {
            return;
        }

        leadCapture.classList.remove('is-visible');

        const finalize = () => {
            if (!leadCapture.hasAttribute('hidden')) {
                leadCapture.setAttribute('hidden', '');
            }
            if ((!modal || modal.hasAttribute('hidden')) && body.classList.contains('modal-open')) {
                body.classList.remove('modal-open');
            }
            if (leadActiveFocus && typeof leadActiveFocus.focus === 'function') {
                leadActiveFocus.focus({ preventScroll: true });
            }
            leadActiveFocus = null;
        };

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            finalize();
        } else {
            window.setTimeout(finalize, 350);
        }
    };

    const markLeadCapture = () => {
        safeSession.set(LEAD_STORAGE_KEY, 'true');
        cancelLeadTimer();
    };

    const startLeadTimer = (delay = 60000) => {
        if (!leadCapture || safeSession.get(LEAD_STORAGE_KEY) === 'true') {
            return;
        }
        cancelLeadTimer();
        leadTimer = window.setTimeout(showLeadCapture, delay);
    };

    const clearEmailError = () => {
        if (!emailInput || !emailError) {
            return;
        }
        emailInput.classList.remove('is-invalid');
        emailInput.removeAttribute('aria-invalid');
        emailInput.setCustomValidity('');
        emailError.textContent = '';
        emailError.classList.remove('active');
    };

    const updateEmailErrorMessage = (value, { allowEmpty = false } = {}) => {
        if (!emailInput || !emailError) {
            return;
        }

        if (!value) {
            if (allowEmpty) {
                clearEmailError();
                return;
            }
            emailInput.classList.add('is-invalid');
            emailInput.setAttribute('aria-invalid', 'true');
            const message = copy('contact_email_required_error');
            emailInput.setCustomValidity(message);
            emailError.textContent = message;
            emailError.classList.add('active');
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        if (!emailPattern.test(value)) {
            emailInput.classList.add('is-invalid');
            emailInput.setAttribute('aria-invalid', 'true');
            const message = copy('contact_email_format_error');
            emailInput.setCustomValidity(message);
            emailError.textContent = message;
            emailError.classList.add('active');
            return;
        }

        clearEmailError();
    };

    if (emailInput) {
        emailInput.addEventListener('input', (event) => {
            updateEmailErrorMessage(event.target.value.trim(), { allowEmpty: false });
        });
        emailInput.addEventListener('blur', (event) => {
            updateEmailErrorMessage(event.target.value.trim(), { allowEmpty: false });
        });
    }

    const sendFormViaAjax = async (formElement) => {
        const formData = new FormData(formElement);
        if (!formData.has('_captcha')) {
            formData.append('_captcha', 'false');
        }

        const action = formElement.getAttribute('action') || 'https://formsubmit.co/info@eswork.eu';
        const endpoint = action.includes('/ajax/') ? action : action.replace('formsubmit.co/', 'formsubmit.co/ajax/');

        const payload = new URLSearchParams();
        formData.forEach((value, key) => {
            if (typeof File !== 'undefined' && value instanceof File) {
                payload.append(key, value.name);
                return;
            }
            payload.append(key, value);
        });

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: payload
        });

        if (!response.ok) {
            throw new Error('Network error');
        }

        const result = await response.json();
        if (result.success !== 'true' && result.success !== true) {
            throw new Error('FormSubmit error');
        }
    };

    const mountVideo = (placeholder) => {
        if (!placeholder || placeholder.dataset.videoLoaded === 'true') {
            return;
        }

        const src = placeholder.dataset.videoSrc;
        if (!src) {
            return;
        }

        const title = placeholder.dataset.videoTitle || '';
        const autoplaySrc = src.includes('?') ? `${src}&autoplay=1` : `${src}?autoplay=1`;
        const iframe = document.createElement('iframe');
        iframe.src = autoplaySrc;
        iframe.title = title;
        iframe.loading = 'lazy';
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
        iframe.setAttribute('allowfullscreen', '');
        iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');

        const wrapper = placeholder.parentElement;
        placeholder.dataset.videoLoaded = 'true';

        if (wrapper) {
            wrapper.replaceChild(iframe, placeholder);
        } else {
            placeholder.replaceWith(iframe);
        }
    };

    videoPlaceholders.forEach((placeholder) => {
        const trigger = placeholder.querySelector('[data-video-trigger]');
        if (trigger) {
            trigger.addEventListener('click', () => mountVideo(placeholder));
        }
    });

    if (requestForm) {
        const handleRequestSubmit = async (event) => {
            event.preventDefault();

            const value = emailInput ? emailInput.value.trim() : '';
            updateEmailErrorMessage(value, { allowEmpty: false });

            if (emailInput && emailInput.classList.contains('is-invalid')) {
                emailInput.focus({ preventScroll: true });
                emailInput.reportValidity();
                return;
            }

            if (!requestForm.checkValidity()) {
                requestForm.reportValidity();
                return;
            }

            const submitButton = requestForm.querySelector('button[type="submit"]');
            const originalText = submitButton ? submitButton.textContent : '';

            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = copy('status_sending') || originalText;
            }

            try {
                await sendFormViaAjax(requestForm);
                requestForm.reset();
                clearEmailError();

                openModal({
                    title: copy('modal_success_title'),
                    message: copy('modal_success_message'),
                    isError: false,
                    ctaText: copy('modal_success_cta')
                });
            } catch (error) {
                if (!requestForm.dataset.nativeSubmit) {
                    requestForm.dataset.nativeSubmit = 'true';
                    requestForm.removeEventListener('submit', handleRequestSubmit);
                    requestForm.submit();
                    requestForm.addEventListener('submit', handleRequestSubmit);
                    delete requestForm.dataset.nativeSubmit;
                    return;
                }

                openModal({
                    title: copy('modal_error_title'),
                    message: copy('modal_error_message'),
                    isError: true,
                    ctaText: copy('modal_error_cta')
                });
            } finally {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = originalText;
                }
            }
        };

        requestForm.addEventListener('submit', handleRequestSubmit);
    }

    if (leadCapture) {
        leadCapture.addEventListener('click', (event) => {
            if (event.target === leadCapture) {
                markLeadCapture();
                hideLeadCapture();
            }
        });
    }

    leadCloseTriggers.forEach((trigger) => {
        trigger.addEventListener('click', () => {
            markLeadCapture();
            hideLeadCapture();
        });
    });

    if (leadForm) {
        leadForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            if (!leadForm.checkValidity()) {
                leadForm.reportValidity();
                return;
            }

            const submitButton = leadForm.querySelector('button[type="submit"]');
            const originalText = submitButton ? submitButton.textContent : '';

            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = copy('status_sending') || originalText;
            }

            try {
                await sendFormViaAjax(leadForm);
                leadForm.reset();
                markLeadCapture();
                hideLeadCapture();

                openModal({
                    title: copy('lead_success_title'),
                    message: copy('lead_success_message'),
                    isError: false,
                    ctaText: copy('lead_success_cta')
                });
            } catch (error) {
                openModal({
                    title: copy('lead_error_title'),
                    message: copy('lead_error_message'),
                    isError: true,
                    ctaText: copy('lead_error_cta')
                });
            } finally {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = originalText;
                }
            }
        });
    }

    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') {
            return;
        }
        if (modal && !modal.hasAttribute('hidden')) {
            closeModal();
        }
        if (leadCapture && leadCapture.classList.contains('is-visible')) {
            markLeadCapture();
            hideLeadCapture();
        }
    });

    document.addEventListener('visibilitychange', () => {
        if (!leadCapture || safeSession.get(LEAD_STORAGE_KEY) === 'true') {
            return;
        }
        if (document.visibilityState === 'hidden') {
            cancelLeadTimer();
        } else if (!leadCapture.classList.contains('is-visible')) {
            startLeadTimer(1500);
        }
    });

    const initialLang = detectInitialLanguage();
    applyLanguage(initialLang, { persist: true });

    startLeadTimer();
})();
