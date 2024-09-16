import { Component, ElementRef, Renderer2 } from '@angular/core';
import { BaseDialog } from '../../../common/dialogs/base-dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EmailValidator } from '../../../common/validators/email.validator';
import { IssuerStaffRoleSlug } from '../../models/issuer-api.model';
import { BadgrApiFailure } from '../../../common/services/api-failure';
import { MessageService } from '../../../common/services/message.service';
import { IssuerManager } from '../../services/issuer-manager.service';
import { Issuer, issuerStaffRoles } from '../../models/issuer.model';
import { UserProfileManager } from '../../../common/services/user-profile-manager.service';
import { AppConfigService } from '../../../common/app-config.service';
import { CommonDialogsService } from '../../../common/services/common-dialogs.service';
import { typedFormGroup } from '../../../common/util/typed-forms';
import { MemoizedProperty } from '../../../common/util/memoized-property-decorator';
import { ColumnHeaders } from '../badgeclass-issue-bulk-award/badgeclass-issue-bulk-award.component';
import { Router, ActivatedRoute } from '@angular/router';

type AddMemberDialogTabName = 'single' | 'bulk';
export type DestSelectOptions = 'email' | 'role' | 'NA';
export type ViewState = 'import' | 'importPreview' | 'importError' | 'importConformation' | 'cancel' | 'exit';
export interface BulkMembersImportPreviewData {
	columnHeaders: ColumnHeaders[];
	invalidRows: string[][];
	rowLongerThenHeader: boolean;
	rows: string[];
	validRows: string[][];
}

export interface BulkMembersData {
	email: string;
	role: IssuerStaffRoleSlug;
}

export interface TransformedImportData {
	duplicateRecords: BulkMembersData[];
	validRowsTransformed: Set<BulkMembersData>;
	invalidRowsTransformed: BulkMembersData[];
}

@Component({
	selector: 'issuer-staff-create-dialog',
	templateUrl: './issuer-staff-create-dialog.component.html',
	styleUrls: ['./issuer-staff-create-dialog.component.css'],
})
export class IssuerStaffCreateDialogComponent extends BaseDialog {
	staffCreateForm = typedFormGroup()
		.addControl('staffRole', 'staff' as IssuerStaffRoleSlug, Validators.required)
		.addControl('staffEmail', '', [Validators.required, EmailValidator.validEmail]);

	importPreviewData: BulkMembersImportPreviewData;
	transformedImportData: TransformedImportData;
	viewState: ViewState;

	issuer: Issuer;
	issuerLoaded: Promise<Issuer>;
	error: string = null;

	currentTab: AddMemberDialogTabName = 'single';

	csvForm: FormGroup;
	columnHeadersCount: number;
	rawCsv: string = null;

	constructor(
		componentElem: ElementRef,
		renderer: Renderer2,
		protected formBuilder: FormBuilder,
		protected messageService: MessageService,
		protected issuerManager: IssuerManager,
		protected profileManager: UserProfileManager,
		protected configService: AppConfigService,
		protected dialogService: CommonDialogsService,
		protected router: Router,
		protected route: ActivatedRoute
	) {
		super(componentElem, renderer);

		this.updateViewState('import');
	}

	onBulkIssueImportPreviewData(importPreviewData: BulkMembersImportPreviewData) {
		this.importPreviewData = importPreviewData;
		this.updateViewState('importPreview');
	}

	onTransformedImportData(transformedImportData) {
		this.transformedImportData = transformedImportData;

		// Determine if the transformed data contains any errors
		this.transformedImportData && transformedImportData.invalidRowsTransformed.length
			? this.updateViewState('importError')
			: this.updateViewState('importConformation');
	}

	updateViewState(state: ViewState) {
		if (state === 'cancel' || state === 'exit') {
			this.updateViewState('import');
			this.closeDialog();
			return;
		}
		this.viewState = state;
	}

	createRange = (size: number) => {
		const items: string[] = [];
		for (let i = 1; i <= size; i++) {
			items.push('');
		}
		return items;
	};

	openDialog() {
		this.showModal();
	}

	closeDialog() {
		this.closeModal();
		this.staffCreateForm.reset();
	}

	@MemoizedProperty()
	get issuerStaffRoleOptions() {
		return issuerStaffRoles.map((r) => ({
			label: r.label,
			value: r.slug,
			description: r.description,
		}));
	}

	submitStaffCreate() {
		if (!this.staffCreateForm.markTreeDirtyAndValidate()) {
			return;
		}

		const formData = this.staffCreateForm.value;

		return this.issuer.addStaffMember(formData.staffRole, formData.staffEmail).then(
			() => {
				this.error = null;
				this.messageService.reportMinorSuccess(`Added ${formData.staffEmail} as ${formData.staffRole}`);
				this.closeModal();
			},
			(error) => {
				const err = BadgrApiFailure.from(error);
				this.error =
					BadgrApiFailure.messageIfThrottableError(JSON.parse(err.overallMessage)) ||
					`Failed to add member: ${err.firstMessage}`;
			}
		);
	}
}

interface ImportCsvForm<T> {
	file: T;
}
