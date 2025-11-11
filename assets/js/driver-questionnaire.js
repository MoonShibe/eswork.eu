(function () {
    const form = document.getElementById('driverQuestionnaire');
    if (!form) {
        return;
    }

    const statusElement = form.querySelector('[data-form-status]');
    const submitButton = form.querySelector('[type="submit"]');
    const otherToggle = document.getElementById('licenseOther');
    const otherTextField = document.getElementById('licenseOtherText');
    const mailtoTarget = (form.getAttribute('data-mailto') || 'info@eswork.eu').trim();
    const mailtoSubject = (form.getAttribute('data-mailto-subject') || 'Kundenfragebogen – Fahrerbedarf').trim() || 'Kundenfragebogen – Fahrerbedarf';
    const MAILTO_IGNORED_FIELDS = new Set([
        '_subject',
        '_template',
        '_captcha',
        '_next',
        '_honey',
        '_autoresponse',
        '_cc',
        '_bcc'
    ]);

    const groupConfigs = [
        {
            name: 'einsatzdauer',
            type: 'checkbox',
            errorId: 'einsatzdauer-error',
            message: 'Bitte wählen Sie mindestens eine Einsatzdauer aus.'
        },
        {
            name: 'einsatztyp',
            type: 'radio',
            errorId: 'einsatztyp-error',
            message: 'Bitte wählen Sie eine Einsatzart aus.'
        },
        {
            name: 'license',
            type: 'checkbox',
            errorId: 'license-error',
            message: 'Bitte wählen Sie mindestens eine Führerscheinklasse aus.'
        },
        {
            name: 'language',
            type: 'checkbox',
            errorId: 'language-error',
            message: 'Bitte wählen Sie mindestens eine Betriebssprache aus.'
        },
        {
            name: 'employment',
            type: 'checkbox',
            errorId: 'employment-error',
            message: 'Bitte wählen Sie mindestens eine Beschäftigungsform aus.'
        },
        {
            name: 'overnight',
            type: 'radio',
            errorId: 'overnight-error',
            message: 'Bitte treffen Sie eine Auswahl.'
        },
        {
            name: 'accommodation',
            type: 'radio',
            errorId: 'accommodation-error',
            message: 'Bitte treffen Sie eine Auswahl.'
        },
        {
            name: 'abrechnung',
            type: 'radio',
            errorId: 'billing-error',
            message: 'Bitte wählen Sie eine Abrechnungsart aus.'
        }
    ];

    const getGroupInputs = (name) => Array.from(form.querySelectorAll(`[data-required-group="${name}"]`));
    const getGroupTextInputs = (name) => Array.from(form.querySelectorAll(`[data-group-text="${name}"]`));

    const clearStatus = () => {
        if (!statusElement) {
            return;
        }
        statusElement.classList.remove('is-visible', 'is-error');
        statusElement.textContent = '';
    };

    const showStatus = (message, isError = false) => {
        if (!statusElement) {
            return;
        }
        statusElement.textContent = message;
        statusElement.classList.add('is-visible');
        statusElement.classList.toggle('is-error', Boolean(isError));
    };

    const getErrorMessage = (field) => {
        if (field.validity.valueMissing) {
            return 'Dieses Feld ist erforderlich.';
        }
        if (field.type === 'email' && field.validity.typeMismatch) {
            return 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
        }
        if (field.type === 'tel' && (field.validity.patternMismatch || field.validity.typeMismatch)) {
            return 'Bitte geben Sie eine gültige Telefonnummer ein.';
        }
        if (field.type === 'number') {
            if (field.validity.rangeOverflow) {
                return `Der Wert darf höchstens ${field.max} betragen.`;
            }
            if (field.validity.rangeUnderflow) {
                return `Der Wert muss mindestens ${field.min} betragen.`;
            }
        }
        if (field.validity.typeMismatch || field.validity.patternMismatch) {
            return 'Bitte verwenden Sie das vorgegebene Format.';
        }
        return 'Bitte prüfen Sie Ihre Eingabe.';
    };

    const updateFieldError = (field, isValid) => {
        if (!field.id) {
            return;
        }
        const errorElement = document.getElementById(`${field.id}-error`);
        if (!errorElement) {
            return;
        }

        if (field.disabled) {
            errorElement.textContent = '';
            field.removeAttribute('aria-invalid');
            return;
        }

        if (isValid) {
            errorElement.textContent = '';
            field.removeAttribute('aria-invalid');
        } else {
            errorElement.textContent = getErrorMessage(field);
            field.setAttribute('aria-invalid', 'true');
        }
    };

    const validateField = (field) => {
        if (field.type === 'checkbox' && field.dataset.requiredGroup) {
            return true;
        }
        if (field.type === 'radio') {
            return true;
        }
        const isValid = field.checkValidity();
        updateFieldError(field, isValid);
        return isValid;
    };

    const validateGroup = (config) => {
        const inputs = getGroupInputs(config.name);
        const textInputs = getGroupTextInputs(config.name);
        const errorElement = document.getElementById(config.errorId);
        if ((!inputs.length && !textInputs.length) || !errorElement) {
            return true;
        }

        const hasSelection = inputs.some((input) => {
            if (input.type === 'checkbox' || input.type === 'radio') {
                return input.checked;
            }
            return Boolean(input.value && input.value.trim());
        });
        const hasText = textInputs.some((input) => Boolean(input.value && input.value.trim()));
        const isValid = hasSelection || hasText;
        errorElement.textContent = isValid ? '' : config.message;

        inputs.forEach((input) => {
            if (isValid) {
                input.removeAttribute('aria-invalid');
            } else {
                input.setAttribute('aria-invalid', 'true');
            }
        });

        textInputs.forEach((input) => {
            if (isValid || (input.value && input.value.trim())) {
                input.removeAttribute('aria-invalid');
            } else {
                input.setAttribute('aria-invalid', 'true');
            }
        });

        return isValid;
    };

    const updateLicenseOtherField = () => {
        if (!otherToggle || !otherTextField) {
            return;
        }
        const isActive = otherToggle.checked;
        otherTextField.disabled = !isActive;
        otherTextField.required = isActive;
        if (!isActive) {
            otherTextField.value = '';
            updateFieldError(otherTextField, true);
        } else {
            otherTextField.focus();
        }
    };

    const setSubmitting = (isSubmitting) => {
        if (submitButton) {
            submitButton.disabled = Boolean(isSubmitting);
        }
        form.classList.toggle('is-submitting', Boolean(isSubmitting));
    };

    const buildMailtoLinkFromForm = () => {
        if (!mailtoTarget) {
            return null;
        }

        const formData = new FormData(form);
        const subjectValue = formData.get('_subject') || mailtoSubject;
        const subject = String(subjectValue || mailtoSubject).trim() || mailtoSubject;

        const aggregated = new Map();
        formData.forEach((value, key) => {
            if (MAILTO_IGNORED_FIELDS.has(key)) {
                return;
            }
            const stringValue = value == null ? '' : String(value).trim();
            if (!stringValue) {
                return;
            }
            const existing = aggregated.get(key) || [];
            existing.push(stringValue);
            aggregated.set(key, existing);
        });

        const lines = [];
        aggregated.forEach((values, key) => {
            const label = key.replace(/_/g, ' ');
            lines.push(`${label}: ${values.join(', ')}`);
        });

        const body = lines.join('\n');
        const params = [];
        if (subject) {
            params.push(`subject=${encodeURIComponent(subject)}`);
        }
        if (body) {
            params.push(`body=${encodeURIComponent(body)}`);
        }

        const query = params.length ? `?${params.join('&')}` : '';
        return `mailto:${mailtoTarget}${query}`;
    };

    const triggerMailtoFallback = () => {
        try {
            const link = buildMailtoLinkFromForm();
            if (!link) {
                return false;
            }
            window.location.href = link;
            return true;
        } catch (error) {
            return false;
        }
    };

    const submitForm = async () => {
        const formData = new FormData(form);
        if (!formData.has('_subject')) {
            formData.append('_subject', 'Kundenfragebogen – Fahrerbedarf');
        }
        if (!formData.has('_captcha')) {
            formData.append('_captcha', 'false');
        }

        const action = form.getAttribute('action') || 'https://formsubmit.co/info@eswork.eu';
        const endpoint = action.includes('/ajax/') ? action : action.replace('formsubmit.co/', 'formsubmit.co/ajax/');

        const payload = new URLSearchParams();
        formData.forEach((value, key) => {
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

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        clearStatus();

        let formIsValid = true;
        let focusTarget = null;

        const fields = Array.from(form.querySelectorAll('input, textarea, select'));
        fields.forEach((field) => {
            if (field.type === 'checkbox' && field.dataset.requiredGroup) {
                return;
            }
            if (field.type === 'radio') {
                return;
            }
            const isValid = validateField(field);
            if (!isValid) {
                formIsValid = false;
                if (!focusTarget) {
                    focusTarget = field;
                }
            }
        });

        groupConfigs.forEach((config) => {
            const isValid = validateGroup(config);
            if (!isValid) {
                formIsValid = false;
                if (!focusTarget) {
                    const groupInputs = getGroupInputs(config.name);
                    focusTarget = groupInputs.length ? groupInputs[0] : focusTarget;
                }
            }
        });

        if (!formIsValid) {
            showStatus('Bitte prüfen Sie Ihre Eingaben. Fehlende Angaben sind markiert.', true);
            if (focusTarget && typeof focusTarget.focus === 'function') {
                focusTarget.focus();
            }
            return;
        }

        try {
            setSubmitting(true);
            await submitForm();
            showStatus('Vielen Dank! Ihre Angaben wurden erfolgreich übermittelt. Wir melden uns zeitnah bei Ihnen.', false);
        } catch (error) {
            showStatus('Senden nicht möglich. Bitte versuchen Sie es erneut oder kontaktieren Sie uns direkt unter +49 (0) 152 25362172 oder info@eswork.eu.', true);
        } finally {
            setSubmitting(false);
        }
    });

    Array.from(form.querySelectorAll('input, textarea')).forEach((field) => {
        field.addEventListener('input', () => {
            if (field.type === 'checkbox' && field.dataset.requiredGroup) {
                return;
            }
            if (field.type === 'radio') {
                return;
            }
            validateField(field);
        });
        field.addEventListener('blur', () => {
            if (field.type === 'checkbox' && field.dataset.requiredGroup) {
                return;
            }
            if (field.type === 'radio') {
                return;
            }
            validateField(field);
        });
    });

    groupConfigs.forEach((config) => {
        const inputs = getGroupInputs(config.name);
        const textInputs = getGroupTextInputs(config.name);
        inputs.forEach((input) => {
            input.addEventListener('change', () => {
                validateGroup(config);
                clearStatus();
            });
        });
        textInputs.forEach((input) => {
            input.addEventListener('input', () => {
                validateGroup(config);
                clearStatus();
            });
        });
    });

    if (otherToggle) {
        otherToggle.addEventListener('change', () => {
            updateLicenseOtherField();
            clearStatus();
        });
    }

    if (otherTextField) {
        otherTextField.addEventListener('input', () => {
            validateField(otherTextField);
        });
    }

    updateLicenseOtherField();
})();
