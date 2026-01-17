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
        this.handleDragOver = this.handleDragOver.bind(this);
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

        this.data.lines.forEach(item => {
            const lineDiv = document.createElement('div');
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

            // Append columns to row
            row.appendChild(colSwitch);
            row.appendChild(colText);

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

                // Resequence lines
                const currentRows = this.container.querySelectorAll('.list-group-item');
                currentRows.forEach((row, index) => {
                    const newLineNumber = index + 1;

                    // Update dataset
                    row.dataset.lineNumber = newLineNumber;

                    // Update controls
                    const btnCheck = row.querySelector('input[type="checkbox"]');
                    const btnLabel = row.querySelector('label');

                    if (btnCheck && btnLabel) {
                        btnCheck.id = `btn-check-${newLineNumber}`;
                        btnLabel.setAttribute('for', `btn-check-${newLineNumber}`);
                        btnLabel.textContent = newLineNumber;
                    }
                });

                this.updateJsonOutput();
            });

            this.container.appendChild(lineDiv);
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
