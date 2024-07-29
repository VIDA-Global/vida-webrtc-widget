import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import './index.css';
import App from './App';

// Constants
const WIDGET_CLASS_NAME = 'vida-webrtc-widget';
const DATA_RENDERED_ATTRIBUTE = 'data-rendered';

// Setup Axios once here
axios.defaults.headers = { Accept: 'application/json' };
const axiosInstance = axios.create({
    baseURL: process.env.REACT_APP_BASE_URL
});
export default axiosInstance;

// Function to render widgets
const renderWidgets = (elements) => {
    elements.forEach(div => {
        if (!div.getAttribute(DATA_RENDERED_ATTRIBUTE)) { // Check if widget is already rendered
            ReactDOM.render(
              <React.StrictMode>
                <App agent={div.dataset.agent} welcome={div.dataset.welcome} size={div.dataset.size} mode={div.dataset.mode} />
              </React.StrictMode>,
                div
            );
            div.setAttribute(DATA_RENDERED_ATTRIBUTE, 'true'); // Mark this widget as rendered
        }
    });
};

// Initial render for elements already in the DOM
renderWidgets(document.querySelectorAll(`.${WIDGET_CLASS_NAME}`));

// Observe the DOM for changes
const observer = new MutationObserver((mutations) => {
    const newWidgets = [];
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1 && node.classList.contains(WIDGET_CLASS_NAME)) {
                    newWidgets.push(node);
                } else if (node.nodeType === 1) {
                    // Check if any descendants have the target class
                    node.querySelectorAll(`.${WIDGET_CLASS_NAME}`).forEach((descendant) => {
                        newWidgets.push(descendant);
                    });
                }
            });
        }
    });
    if (newWidgets.length > 0) {
        renderWidgets(newWidgets);
    }
});

// Configure the observer to watch for additions to the DOM
observer.observe(document.body, { childList: true, subtree: true });
