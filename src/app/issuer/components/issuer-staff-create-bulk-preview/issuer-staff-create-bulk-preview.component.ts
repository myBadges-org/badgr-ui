import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionService } from '../../../common/services/session.service';
import { MessageService } from '../../../common/services/message.service';
import { BaseAuthenticatedRoutableComponent } from '../../../common/pages/base-authenticated-routable.component';

import {
	BulkMembersData,
	BulkMembersImportPreviewData,
	DestSelectOptions,
	TransformedImportData,
	ViewState,
} from '../issuer-staff-create-dialog/issuer-staff-create-dialog.component';

@Component({
	selector: 'issuer-staff-create-bulk-preview',
	templateUrl: './issuer-staff-create-bulk-preview.component.html',
})
export class IssuerStaffCreateBulkPreviewComponent extends BaseAuthenticatedRoutableComponent {
	@Input() importPreviewData: BulkMembersImportPreviewData;

	@Output() updateStateEmitter = new EventEmitter<ViewState>();
	@Output() transformedImportDataEmitter = new EventEmitter();

	MAX_ROWS_TO_DISPLAY = 3;

	buttonDisabledAttribute = true;
	buttonDisabledClass = true;
	columnHeadersCount: number;
	destNameToColumnHeaderMap: {
		[destColumnName: string]: number;
	};
	duplicateRecords: BulkMembersData[] = [];

	rowIsLongerThanHeader: boolean;
	validRowsTransformed = new Set<BulkMembersData>();
	invalidRowsTransformed = Array<BulkMembersData>();

	viewState: ViewState;

	constructor(
		protected formBuilder: FormBuilder,
		protected loginService: SessionService,
		protected messageService: MessageService,
		protected router: Router,
		protected route: ActivatedRoute
	) {
		super(router, route, loginService);
	}

	ngOnChanges(changes) {
		this.disableActionButton();
		this.rowIsLongerThanHeader = this.importPreviewData.rowLongerThenHeader;
		this.columnHeadersCount = this.importPreviewData.columnHeaders.length;

		if (!this.importPreviewData.rowLongerThenHeader) {
			this.isEmailColumnHeaderMapped() ? this.enableActionButton() : this.disableActionButton();
		}
	}

	disableActionButton() {
		this.buttonDisabledClass = true;
		this.buttonDisabledAttribute = true;
	}

	enableActionButton() {
		this.buttonDisabledClass = false;
		this.buttonDisabledAttribute = null;
	}

	updateViewState(state: ViewState) {
		this.viewState = state;
		this.updateStateEmitter.emit(state);
	}

	emitTransformedData() {
		const transformedImportData: TransformedImportData = {
			duplicateRecords: this.duplicateRecords,
			validRowsTransformed: this.validRowsTransformed,
			invalidRowsTransformed: this.invalidRowsTransformed,
		};

		this.transformedImportDataEmitter.emit(transformedImportData);
	}

	isEmailColumnHeaderMapped(): boolean {
		return this.importPreviewData.columnHeaders.some((columnHeader) => columnHeader.destColumn === 'email');
	}

	//////// Generating import data ////////
	generateImportPreview() {
		this.generateDestNameToColumnHeaderMap();
		this.removeFromInvalidRowsWithEmptyOptionalCells();
		this.transformInvalidRows();
		this.transformValidRows();
		this.removeDuplicateEmails();
		this.emitTransformedData();
	}

	removeFromInvalidRowsWithEmptyOptionalCells() {
		const invalidRow = [];
		let emptyCellsAreOptional: boolean;

		this.importPreviewData.invalidRows.forEach((row) => {
			emptyCellsAreOptional = row.every((cell, index) => {
				if (!cell.length && index !== this.destNameToColumnHeaderMap['role']) {
					return false;
				}
				if (cell.length) {
					return true;
				} else if (!cell.length && index === this.destNameToColumnHeaderMap['role']) {
					return true;
				} else {
					return false;
				}
			});

			emptyCellsAreOptional ? this.importPreviewData.validRows.push(row) : invalidRow.push(row);
		});

		this.importPreviewData.invalidRows = invalidRow;
	}

	transformInvalidRows() {
		this.importPreviewData.invalidRows.forEach((row) => {
			this.invalidRowsTransformed.push({
				role: this.getRoleFromRow(row),
				email: this.getEmailFromRow(row),
			});
		});
	}

	transformValidRows() {
		this.importPreviewData.validRows.forEach((row) => {
			this.validRowsTransformed.add({
				role: this.getRoleFromRow(row),
				email: this.getEmailFromRow(row),
			});
		});
	}

	removeDuplicateEmails() {
		const tempRow = new Set<string>();
		this.validRowsTransformed.forEach((row) => {
			if (tempRow.has(row.email)) {
				this.duplicateRecords.push(row);
				this.validRowsTransformed.delete(row);
			} else {
				tempRow.add(row.email);
			}
		});
	}

	mapDestNameToSourceName(columnHeaderId: number, selected: DestSelectOptions) {
		Object.keys(this.importPreviewData.columnHeaders).forEach((columnId) => {
			if (
				columnId !== columnHeaderId.toString() &&
				this.importPreviewData.columnHeaders[columnId].destColumn === selected
			) {
				this.importPreviewData.columnHeaders[columnId].destColumn = 'NA';
			}

			if (columnId === columnHeaderId.toString()) {
				this.importPreviewData.columnHeaders[columnId].destColumn = selected;
			}
		});

		this.isEmailColumnHeaderMapped() ? this.enableActionButton() : this.disableActionButton();
	}

	getRoleFromRow(row) {
		return this.getCellFromRowByDestName('role', row);
	}

	getEmailFromRow(row) {
		return this.getCellFromRowByDestName('email', row);
	}

	getCellFromRowByDestName(destName: string, row: Object) {
		return row[this.destNameToColumnHeaderMap[destName]];
	}

	generateDestNameToColumnHeaderMap() {
		this.destNameToColumnHeaderMap = {};
		Object.keys(this.importPreviewData.columnHeaders).forEach((key) => {
			if (this.importPreviewData.columnHeaders[key].destColumn !== 'NA') {
				this.destNameToColumnHeaderMap[this.importPreviewData.columnHeaders[key].destColumn] = Number(key);
			}
		});
	}

	createRange(size: number) {
		const items: string[] = [];
		for (let i = 1; i <= size; i++) {
			items.push('');
		}
		return items;
	}
}
