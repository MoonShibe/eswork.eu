(function () {
    const form = document.getElementById('driverQuestionnaire');
    if (!form) {
        return;
    }

    const statusElement = form.querySelector('[data-form-status]');
    const otherToggle = document.getElementById('licenseOther');
    const otherTextField = document.getElementById('licenseOtherText');

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
        const errorElement = document.getElementById(config.errorId);
        if (!inputs.length || !errorElement) {
            return true;
        }

        const isValid = inputs.some((input) => input.checked);
        errorElement.textContent = isValid ? '' : config.message;

        inputs.forEach((input) => {
            if (isValid) {
                input.removeAttribute('aria-invalid');
            } else {
                input.setAttribute('aria-invalid', 'true');
            }
        });

        return isValid;
    };

    const clearAllErrors = () => {
        form.querySelectorAll('.form-error').forEach((element) => {
            element.textContent = '';
        });
        form.querySelectorAll('[aria-invalid="true"]').forEach((element) => {
            element.removeAttribute('aria-invalid');
        });
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

    const formatList = (values) => {
        if (!values || !values.length) {
            return '–';
        }
        return values.join(', ');
    };

    const buildMailtoBody = (formData) => {
        const einsatzdauer = formData.getAll('einsatzdauer');
        const fuehrerscheine = formData.getAll('fuehrerscheinklasse');
        const sprachen = formData.getAll('betriebssprache');
        const beschaeftigung = formData.getAll('beschaeftigungsform');

        if (fuehrerscheine.includes('Andere')) {
            const index = fuehrerscheine.indexOf('Andere');
            const detail = formData.get('licenseOtherText');
            fuehrerscheine[index] = detail ? `Andere (${detail})` : 'Andere';
        }

        const lines = [
            'KUNDENFRAGEBOGEN – FAHRERBEDARF',
            '',
            '1. Allgemeine Informationen',
            `Firma: ${formData.get('company') || '–'}`,
            `Ansprechpartner: ${formData.get('contactPerson') || '–'}`,
            `Position: ${formData.get('position') || '–'}`,
            `Telefon: ${formData.get('phone') || '–'}`,
            `E-Mail: ${formData.get('email') || '–'}`,
            `Standorte: ${formData.get('locations') || '–'}`,
            '',
            '2. Bedarf an Fahrpersonal',
            `Benötigte Fahrer:innen: ${formData.get('driverCount') || '–'}`,
            `Einsatzbeginn: ${formData.get('startDate') || '–'}`,
            `Einsatzdauer: ${formatList(einsatzdauer)}`,
            `Einsatzart: ${formData.get('einsatztyp') || '–'}`,
            `Führerscheinklassen: ${formatList(fuehrerscheine)}`,
            `Fahrzeugtypen: ${formData.get('vehicleTypes') || '–'}`,
            `Transportierte Güter: ${formData.get('goods') || '–'}`,
            '',
            '3. Einsatzbedingungen',
            `Einsatzgebiet / Touren: ${formData.get('tourArea') || '–'}`,
            `Arbeitszeiten / Schichtsystem: ${formData.get('workingHours') || '–'}`,
            `Übernachtung im Fahrzeug: ${formData.get('overnight') || '–'}`,
            `Unterkunft gestellt: ${formData.get('accommodation') || '–'}`,
            `Sprache im Betrieb: ${formatList(sprachen)}`,
            '',
            '4. Konditionen & Organisation',
            `Beschäftigungsform: ${formatList(beschaeftigung)}`,
            `Abrechnung: ${formData.get('abrechnung') || '–'}`,
            `Zielvorstellung / Budget: ${formData.get('budget') || '–'}`,
            `Weitere Besonderheiten: ${formData.get('notes') || '–'}`
        ];

        return lines.join('\n');
    };

    const submitForm = () => {
        const formData = new FormData(form);
        const body = buildMailtoBody(formData);
        const subject = 'Kundenfragebogen – Fahrerbedarf';
        const mailtoUrl = `mailto:info@eswork.eu?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoUrl;
        showStatus('Fast geschafft! Ihr E-Mail-Programm wurde geöffnet. Bitte senden Sie die Nachricht an uns ab.', false);
        form.reset();
        updateLicenseOtherField();
    };

    form.addEventListener('submit', (event) => {
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

        submitForm();
    });

    form.addEventListener('reset', () => {
        window.setTimeout(() => {
            clearAllErrors();
            clearStatus();
            updateLicenseOtherField();
        }, 0);
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
        inputs.forEach((input) => {
            input.addEventListener('change', () => {
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
