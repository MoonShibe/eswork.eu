(() => {
    const CALL_WIDGET_STORAGE_KEY = 'esw-call-widget-dismissed';
    const callWidget = document.querySelector('[data-floating-call]');
    const callWidgetClose = callWidget ? callWidget.querySelector('[data-floating-call-close]') : null;
    const mobileQuery = window.matchMedia('(max-width: 768px)');

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

    const emitAnalyticsEvent = (source, element) => {
        if (typeof window.gtag === 'function') {
            window.gtag('event', 'call_click', {
                event_category: 'engagement',
                event_label: source || 'unknown',
                value: 1
            });
            return;
        }

        if (Array.isArray(window.dataLayer)) {
            window.dataLayer.push({
                event: 'call_click',
                event_label: source || 'unknown',
                element_text: element && element.textContent ? element.textContent.trim() : ''
            });
        }
    };

    const bindCallTracking = () => {
        document.querySelectorAll('[data-track-call]').forEach((element) => {
            if (element.dataset.callTrackingBound === 'true') {
                return;
            }
            element.dataset.callTrackingBound = 'true';
            element.addEventListener('click', () => {
                const source = element.getAttribute('data-track-source') || 'unknown';
                emitAnalyticsEvent(source, element);
                if (callWidget && callWidget.contains(element)) {
                    hideCallWidget(true);
                }
            });
        });
    };

    let callWidgetTimer = null;
    let callWidgetShown = false;
    let lastScrollY = window.scrollY;

    const shouldShowWidget = () => Boolean(callWidget && mobileQuery.matches && safeSession.get(CALL_WIDGET_STORAGE_KEY) !== 'true');

    const cancelWidgetTimer = () => {
        if (callWidgetTimer) {
            window.clearTimeout(callWidgetTimer);
            callWidgetTimer = null;
        }
    };

    const showCallWidget = () => {
        if (!shouldShowWidget() || callWidgetShown) {
            return;
        }

        callWidget.removeAttribute('hidden');
        requestAnimationFrame(() => {
            callWidget.classList.add('is-visible');
        });
        callWidgetShown = true;
    };

    const hideCallWidget = (persist = false) => {
        if (!callWidget) {
            return;
        }

        callWidget.classList.remove('is-visible');
        callWidget.classList.remove('call-fab--hidden');
        callWidgetShown = false;
        if (persist) {
            safeSession.set(CALL_WIDGET_STORAGE_KEY, 'true');
        }

        const finalize = () => {
            if (callWidget && !callWidget.classList.contains('is-visible')) {
                callWidget.setAttribute('hidden', '');
            }
        };

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            finalize();
        } else {
            window.setTimeout(finalize, 250);
        }
    };

    const scheduleCallWidget = () => {
        if (!callWidget || callWidgetShown || !shouldShowWidget()) {
            return;
        }

        cancelWidgetTimer();
        callWidgetTimer = window.setTimeout(() => {
            callWidgetTimer = null;
            showCallWidget();
        }, 5000);
    };

    const handleScroll = () => {
        const currentY = window.scrollY;
        const scrollableHeight = Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);

        if (!callWidgetShown && shouldShowWidget()) {
            const progress = scrollableHeight > 0 ? (currentY + window.innerHeight) / (scrollableHeight + window.innerHeight) : 0;
            if (progress >= 0.55) {
                cancelWidgetTimer();
                showCallWidget();
            }
        }

        if (!callWidget || !callWidget.classList.contains('is-visible')) {
            lastScrollY = currentY;
            return;
        }

        if (Math.abs(currentY - lastScrollY) < 6) {
            return;
        }

        if (currentY > lastScrollY) {
            callWidget.classList.add('call-fab--hidden');
        } else {
            callWidget.classList.remove('call-fab--hidden');
        }

        lastScrollY = currentY;
    };

    const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
            cancelWidgetTimer();
        } else if (!callWidgetShown) {
            scheduleCallWidget();
        }
    };

    bindCallTracking();
    scheduleCallWidget();

    if ('MutationObserver' in window) {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.addedNodes && mutation.addedNodes.length) {
                    bindCallTracking();
                    break;
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    if (callWidgetClose) {
        callWidgetClose.addEventListener('click', () => {
            hideCallWidget(true);
            cancelWidgetTimer();
        });
    }

    if (callWidget) {
        callWidget.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                hideCallWidget(true);
                cancelWidgetTimer();
            }
        });
    }

    window.addEventListener('scroll', handleScroll, { passive: true });

    mobileQuery.addEventListener('change', (event) => {
        if (!event.matches) {
            cancelWidgetTimer();
            hideCallWidget(false);
            callWidgetShown = false;
        } else if (safeSession.get(CALL_WIDGET_STORAGE_KEY) !== 'true') {
            scheduleCallWidget();
        }
    });

    document.addEventListener('visibilitychange', handleVisibilityChange);
})();
