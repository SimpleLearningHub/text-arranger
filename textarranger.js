/**
 * Class representing a text arranger that allows reordering lines via drag and drop.
 */
class TextArranger {
    /**
     * Create a TextArranger.
     * @param {Object} data - The initial data containing lines.
     * @param {HTMLElement} container - The DOM element to render the list into.
     * @param {HTMLTextAreaElement} [outputArea] - Optional text area to update with JSON output.
     */
    constructor(data, container, outputArea) {
        this.data = data;
        this.container = container;
        this.outputArea = outputArea;
        this.pendingDeleteIndex = null;
        this.handleDragOver = this.handleDragOver.bind(this);
        this.injectStyles();
    }

    /**
     * Injects the necessary CSS styles for the dividers.
     */
    injectStyles() {
        if (document.getElementById('text-arranger-styles')) return;
        const style = document.createElement('style');
        style.id = 'text-arranger-styles';
        style.textContent = `
            .text-arranger-divider {
                height: 12px;
                position: relative;
                cursor: pointer;
                opacity: 0;
                transition: opacity 0.2s;
            }
            .text-arranger-divider:hover {
                opacity: 1;
            }
            .text-arranger-divider::before {
                content: '';
                position: absolute;
                top: 50%;
                left: 0;
                right: 0;
                border-top: 2px dashed #0d6efd;
                z-index: 0;
            }
            .text-arranger-divider-btn {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 20px;
                height: 20px;
                background: #0d6efd;
                color: white;
                border-radius: 50%;
                font-size: 16px;
                line-height: 18px;
                text-align: center;
                z-index: 1;
                pointer-events: none; /* Let the parent click handle it */
            }
            .text-arranger-delete-btn {
                width: 24px;
                height: 24px;
                padding: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #dc3545;
                background: transparent;
                border: none;
                cursor: pointer;
                opacity: 0.5;
                transition: opacity 0.2s;
            }
            .text-arranger-delete-btn:hover {
                opacity: 1;
                background: rgba(220, 53, 69, 0.1);
                border-radius: 4px;
            }
            .text-arranger-confirm-btn {
                color: #198754;
            }
            .text-arranger-confirm-btn:hover {
                background: rgba(25, 135, 84, 0.1);
                border-radius: 4px;
                opacity: 1;
            }
            .text-arranger-cancel-btn {
                 color: #6c757d;
            }
            .text-arranger-cancel-btn:hover {
                background: rgba(108, 117, 125, 0.1);
                border-radius: 4px;
                opacity: 1;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Adds a new empty line at the specified index.
     * @param {number} index - The index to insert the new line at.
     */
    addLine(index) {
        this.syncDataFromDOM();
        const newLine = {
            lineNumber: 0, // Will be re-indexed
            text: ""
        };
        this.data.lines.splice(index, 0, newLine);

        // Re-sequence all lines
        this.data.lines.forEach((line, i) => {
            line.lineNumber = i + 1;
        });

        this.render();

        // Focus the new line
        // We need to wait for render to complete
        setTimeout(() => {
            const rows = this.container.querySelectorAll('.list-group-item');
            if (rows[index]) {
                const colText = rows[index].querySelector('.col[contenteditable="true"]');
                if (colText) colText.focus();
            }
        }, 0);
    }

    /**
     * Deletes the line at the specified index.
     * @param {number} index - The index of the line to delete.
     */
    deleteLine(index) {
        this.syncDataFromDOM();
        this.data.lines.splice(index, 1);

        // Re-sequence all lines
        this.data.lines.forEach((line, i) => {
            line.lineNumber = i + 1;
        });

        this.pendingDeleteIndex = null;
        this.render();
        this.updateJsonOutput();
    }

    /**
     * Initiates the delete confirmation for a line.
     * @param {number} index - The index of the line to delete.
     */
    requestDelete(index) {
        this.syncDataFromDOM();
        this.pendingDeleteIndex = index;
        this.render();
    }

    /**
     * Cancels the pending delete action.
     */
    cancelDelete() {
        this.syncDataFromDOM();
        this.pendingDeleteIndex = null;
        this.render();
    }

    /**
     * Creates a divider element.
     * @param {number} index - The index where the new line will be inserted if clicked.
     * @returns {HTMLElement} The divider element.
     */
    createDivider(index) {
        const divider = document.createElement('div');
        divider.classList.add('text-arranger-divider', 'w-100');
        divider.title = 'Click to add line';

        const btn = document.createElement('div');
        btn.classList.add('text-arranger-divider-btn');
        btn.innerHTML = '+';

        divider.appendChild(btn);

        divider.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent interfering with other clicks
            this.addLine(index);
        });

        divider.addEventListener('dragover', (e) => {
            e.preventDefault(); // allow drops nearby but don't error
            e.stopPropagation();
        });

        return divider;
    }


    /**
     * Renders the list of lines into the container.
     * Sets up event listeners for drag and drop.
     */
    render() {
        this.container.innerHTML = ''; // Clear existing content
        this.container.classList.add('list-group');
        this.container.addEventListener('dragover', this.handleDragOver);

        if (!this.data || !this.data.lines) {
            console.error('Invalid data format');
            return;
        }

        // Add separator at the top
        this.container.appendChild(this.createDivider(0));

        this.data.lines.forEach((item, index) => {
            const lineDiv = document.createElement('div');
            // ... (existing lineDiv logic) ...

            // Note: We need to reconstruct the lineDiv logic because we are replacing the loop.
            // However, to keep this efficient in "multi_replace", I should probably wrap the existing loop body or 
            // if I cannot reference existing code easily, I have to duplicate the loop body logic here.
            // Since the tool requires exact target content match, reusing the exact existing loop code is best.

            lineDiv.classList.add('list-group-item', 'py-0', 'px-2', 'border-start-0');
            lineDiv.dataset.lineNumber = item.lineNumber;
            lineDiv.draggable = true;

            // Create container for columns
            const row = document.createElement('div');
            row.classList.add('row', 'align-items-start');
            row.style.minHeight = '24px';

            // Column 1: Toggle Button
            const colSwitch = document.createElement('div');
            colSwitch.classList.add('col-auto', 'p-0');
            colSwitch.style.width = '30px';
            colSwitch.style.height = '24px';

            const btnCheck = document.createElement('input');
            btnCheck.type = 'checkbox';
            btnCheck.classList.add('btn-check');
            btnCheck.id = `btn-check-${item.lineNumber}`;
            btnCheck.autocomplete = 'off';

            const btnLabel = document.createElement('label');
            btnLabel.classList.add('btn', 'btn-sm', 'btn-outline-secondary', 'rounded-0', 'px-2', 'py-0', 'm-0', 'd-flex', 'justify-content-center', 'align-items-center');
            btnLabel.setAttribute('for', `btn-check-${item.lineNumber}`);
            btnLabel.innerHTML = `<span>${item.lineNumber}</span>`;
            btnLabel.style.width = '30px';
            btnLabel.style.height = '100%';
            btnLabel.style.fontSize = '12px';

            colSwitch.appendChild(btnCheck);
            colSwitch.appendChild(btnLabel);

            btnCheck.addEventListener('change', () => {
                this.handleToggle(btnCheck, lineDiv);
            });

            // Column 2: Text
            const colText = document.createElement('div');
            colText.classList.add('col');
            colText.contentEditable = true;
            colText.textContent = item.text;

            // Column 3: Delete Button
            const colDelete = document.createElement('div');
            colDelete.classList.add('col-auto', 'p-0');
            colDelete.style.width = '30px';
            colDelete.style.height = '24px';
            colDelete.style.display = 'flex';
            colDelete.style.alignItems = 'center';
            colDelete.style.justifyContent = 'center';

            if (this.pendingDeleteIndex === index) {
                // Confirm Delete (Check)
                const btnConfirm = document.createElement('button');
                btnConfirm.classList.add('text-arranger-delete-btn', 'text-arranger-confirm-btn');
                btnConfirm.innerHTML = '&#10003;'; // Checkmark
                btnConfirm.title = 'Confirm Delete';
                btnConfirm.onclick = (e) => {
                    e.stopPropagation();
                    this.deleteLine(index);
                };

                // Cancel Delete (X or Back)
                const btnCancel = document.createElement('button');
                btnCancel.classList.add('text-arranger-delete-btn', 'text-arranger-cancel-btn');
                btnCancel.innerHTML = '&#10005;'; // Cross
                btnCancel.title = 'Cancel';
                btnCancel.onclick = (e) => {
                    e.stopPropagation();
                    this.cancelDelete();
                };

                colDelete.innerHTML = '';
                colDelete.style.width = '60px'; // Expand width for 2 buttons
                colDelete.appendChild(btnConfirm);
                colDelete.appendChild(btnCancel);
            } else {
                const btnDelete = document.createElement('button');
                btnDelete.classList.add('text-arranger-delete-btn');
                btnDelete.innerHTML = '&times;'; // Multiplication sign as X
                btnDelete.title = 'Delete line';
                btnDelete.onclick = () => this.requestDelete(index);

                colDelete.innerHTML = '';
                colDelete.style.width = '30px'; // Reset width
                colDelete.appendChild(btnDelete);
            }

            colDelete.appendChild(document.createTextNode('')); // Ensure child nodes are updated

            // Append columns to row
            row.appendChild(colSwitch);
            row.appendChild(colText);
            row.appendChild(colDelete);

            colText.addEventListener('keyup', () => {
                this.updateJsonOutput();
            });

            // Append row to main item container
            lineDiv.appendChild(row);

            lineDiv.addEventListener('dragstart', () => {
                const isChecked = lineDiv.querySelector('input[type="checkbox"]').checked;
                if (isChecked) {
                    const checkedRows = this.container.querySelectorAll('.list-group-item input[type="checkbox"]:checked');
                    checkedRows.forEach(cb => {
                        cb.closest('.list-group-item').classList.add('dragging');
                    });
                } else {
                    lineDiv.classList.add('dragging');
                }
            });

            lineDiv.addEventListener('dragend', () => {
                const draggingItems = this.container.querySelectorAll('.dragging');
                draggingItems.forEach(item => item.classList.remove('dragging'));

                // Uncheck all rows
                const allCheckboxes = this.container.querySelectorAll('input[type="checkbox"]');
                allCheckboxes.forEach(cb => cb.checked = false);

                // Sync data from DOM state
                const currentRows = this.container.querySelectorAll('.list-group-item');
                const newLines = [];
                currentRows.forEach((row, index) => {
                    const colText = row.querySelector('.col[contenteditable="true"]');
                    if (colText) {
                        newLines.push({
                            lineNumber: index + 1,
                            text: colText.textContent
                        });
                    }
                });

                this.data.lines = newLines;

                // Re-render to fix dividers and sequence
                this.render();
                this.updateJsonOutput();
            });

            this.container.appendChild(lineDiv);

            // Add separator after each item
            this.container.appendChild(this.createDivider(index + 1));
        });
    }

    /**
     * Handles the dragover event to show the drop position.
     * @param {DragEvent} e - The drag event.
     */
    handleDragOver(e) {
        e.preventDefault();
        const afterElement = this.getDragAfterElement(e.clientY);
        const draggables = this.container.querySelectorAll('.dragging');

        if (draggables.length > 0) {
            draggables.forEach(draggable => {
                if (afterElement == null) {
                    this.container.appendChild(draggable);
                } else {
                    this.container.insertBefore(draggable, afterElement);
                }
            });
        }
    }

    /**
     * Calculates the element after which the dragging element should be placed.
     * @param {number} y - The vertical position of the mouse.
     * @returns {HTMLElement} The element to insert after.
     */
    getDragAfterElement(y) {
        const draggableElements = [...this.container.querySelectorAll('.list-group-item:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return {offset: offset, element: child};
            } else {
                return closest;
            }
        }, {offset: Number.NEGATIVE_INFINITY}).element;
    }

    /**
     * Handles the checkbox toggle logic.
     * Ensures that if a non-contiguous row is checked, all other rows are unchecked.
     * This forces the selection to be a single contiguous block (if using Shift-click logic, though current implementation is simple toggle) or just manages single/multi validation.
     * Actually, the specific logic here is:
     * If I click a box, and the one before it OR the one after it was NOT checked, then I clear everything else.
     * This effectively resets selection if you pick something "far away" from current selection?
     * Let's re-read the code: 
     * If (prev is NOT checked AND next is NOT checked) -> Uncheck ALL OTHERS.
     * So if you pick an isolated item, it clears everything else. This helps maintain contiguous selection or single item selection.
     * @param {HTMLInputElement} changedCheckbox - The checkbox that was changed.
     * @param {HTMLElement} changedRow - The row containing the checkbox.
     */
    handleToggle(changedCheckbox, changedRow) {
        if (!changedCheckbox.checked) return;

        const allRows = [...this.container.querySelectorAll('.list-group-item')];
        const index = allRows.indexOf(changedRow);

        let prevChecked = false;
        let nextChecked = false;

        if (index > 0) {
            const prevCheckbox = allRows[index - 1].querySelector('input[type="checkbox"]');
            if (prevCheckbox && prevCheckbox.checked) prevChecked = true;
        }

        if (index < allRows.length - 1) {
            const nextCheckbox = allRows[index + 1].querySelector('input[type="checkbox"]');
            if (nextCheckbox && nextCheckbox.checked) nextChecked = true;
        }

        if (!prevChecked && !nextChecked) {
            // Uncheck every row other than the current one
            allRows.forEach((row, i) => {
                if (i !== index) {
                    const cb = row.querySelector('input[type="checkbox"]');
                    if (cb) cb.checked = false;
                }
            });
        }
    }

    /**
     * Synchronizes the internal data with the DOM state.
     * This ensures any unsaved text edits are captured before a re-render.
     */
    syncDataFromDOM() {
        if (!this.container) return;
        const currentRows = this.container.querySelectorAll('.list-group-item');
        const lines = [];

        currentRows.forEach((row, index) => {
            const colText = row.querySelector('.col[contenteditable="true"]');
            if (colText) {
                lines.push({
                    lineNumber: index + 1,
                    text: colText.textContent
                });
            }
        });

        // Preserve data integrity if DOM is empty (unlikely but safe)
        if (lines.length > 0 || this.data.lines.length === 0) {
            this.data.lines = lines;
        }
    }

    /**
     * Updates the text area with the current JSON representation of the lines.
     */
    updateJsonOutput() {
        const textarea = this.outputArea;
        // const textarea = document.getElementById('text');
        if (!this.outputArea) return;
        // if (!textarea) return;

        const currentRows = this.container.querySelectorAll('.list-group-item');
        const lines = [];

        currentRows.forEach((row, index) => {
            const colText = row.querySelector('.col[contenteditable="true"]');
            if (colText) {
                lines.push({
                    lineNumber: index + 1,
                    text: colText.textContent
                });
            }
        });

        const data = {'lines': lines};
        this.outputArea.value = JSON.stringify(data, null, 4);
        // textarea.value = JSON.stringify(data, null, 4);
    }
}
