import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionService } from '../../../common/services/session.service';
import { MessageService } from '../../../common/services/message.service';
import { Title } from '@angular/platform-browser';
import { BaseAuthenticatedRoutableComponent } from '../../../common/pages/base-authenticated-routable.component';
import { TransformedImportData, ViewState } from '../issuer-staff-create-dialog/issuer-staff-create-dialog.component';

import { BadgeInstanceManager } from '../../services/badgeinstance-manager.service';
import { BadgeInstanceBatchAssertion } from '../../models/badgeinstance-api.model';
import { BadgrApiFailure } from '../../../common/services/api-failure';
import { Issuer } from '../../models/issuer.model';
import { IssuerManager } from '../../services/issuer-manager.service';

@Component({
	selector: 'issuer-staff-create-bulk-confirmation',
	templateUrl: './issuer-staff-create-bulk-confirmation.component.html',
	styleUrls: ['./issuer-staff-create-bulk-confirmation.component.css'],
})
export class IssuerStaffCreateBulkConfirmation extends BaseAuthenticatedRoutableComponent {
	@Input() transformedImportData: TransformedImportData;
	@Input() issuerSlug: string;
	@Output() updateStateEmitter = new EventEmitter<ViewState>();

	buttonDisabledClass = true;
	buttonDisabledAttribute = true;
	issuer: Issuer;
	issuerLoaded: Promise<Issuer>;
	notifyEarner = true;
	error: string = null;

	issueBadgeFinished: Promise<unknown>;

	constructor(
		protected badgeInstanceManager: BadgeInstanceManager,
		protected sessionService: SessionService,
		protected router: Router,
		protected route: ActivatedRoute,
		protected messageService: MessageService,
		protected formBuilder: FormBuilder,
		protected issuerManager: IssuerManager,
		protected title: Title
	) {
		super(router, route, sessionService);
		this.enableActionButton();
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes.issuerSlug && typeof changes.issuerSlug.currentValue == 'string') {
			this.issuerLoaded = this.issuerManager.issuerBySlug(changes.issuerSlug.currentValue).then((issuer) => {
				this.issuer = issuer;
				return issuer;
			});
		}
	}

	enableActionButton() {
		this.buttonDisabledClass = false;
		this.buttonDisabledAttribute = null;
	}

	disableActionButton() {
		this.buttonDisabledClass = true;
		this.buttonDisabledAttribute = true;
	}

	dataConfirmed() {
		this.disableActionButton();
		let success = true;
		let membersCounter = 0;

		this.transformedImportData.validRowsTransformed.forEach((row, index, array) => {
			this.issuer.addStaffMember(row.role, row.email).then(
				() => {
					membersCounter++;
					this.messageService.reportMinorSuccess(`Added ${row.email} as ${row.role}`);
					this.removeValidRowsTransformed(row);
					if (membersCounter >= array.size) {
						this.enableActionButton();
						if (success) {
							this.error = null;
							this.updateViewState('exit');
						} else {
							this.updateViewState('importConformation');
						}
					}
				},
				(error) => {
					success = false;
					membersCounter++;
					const err = BadgrApiFailure.from(error);
					this.error =
						BadgrApiFailure.messageIfThrottableError(JSON.parse(err.overallMessage)) ||
						`Failed to add member: ${err.firstMessage}`;
					if (membersCounter >= array.size) {
						this.enableActionButton();
						if (success) {
							this.error = null;
							this.updateViewState('exit');
						} else {
							this.updateViewState('importConformation');
						}
					}
				}
			);
		});
	}

	updateViewState(state: ViewState) {
		this.updateStateEmitter.emit(state);
	}

	removeValidRowsTransformed(row) {
		this.transformedImportData.validRowsTransformed.delete(row);
		if (!this.transformedImportData.validRowsTransformed.size) {
			this.disableActionButton();
		}
	}
}
