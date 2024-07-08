import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionService } from '../../../common/services/session.service';
import { MessageService } from '../../../common/services/message.service';
import { Title } from '@angular/platform-browser';
import { BaseAuthenticatedRoutableComponent } from '../../../common/pages/base-authenticated-routable.component';
import { TransformedImportData, ViewState } from '../badgeclass-issue-bulk-award/badgeclass-issue-bulk-award.component';

import { BadgeInstanceManager } from '../../services/badgeinstance-manager.service';
import { BadgeInstanceBatchAssertion } from '../../models/badgeinstance-api.model';
import { BadgrApiFailure } from '../../../common/services/api-failure';
import striptags from 'striptags';
import { SuccessDialogComponent } from '../../../common/dialogs/oeb-dialogs/success-dialog.component';
import { HlmDialogService } from './../../../components/spartan/ui-dialog-helm/src';

@Component({
	selector: 'badgeclass-issue-bulk-award-confirmation',
	templateUrl: './badgeclass-issue-bulk-award-confirmation.component.html',
})
export class BadgeclassIssueBulkAwardConformation extends BaseAuthenticatedRoutableComponent {
	@Input() transformedImportData: TransformedImportData;
	@Input() badgeSlug: string;
	@Input() issuerSlug: string;
	@Output() updateStateEmitter = new EventEmitter<ViewState>();

	buttonDisabledClass = true;
	buttonDisabledAttribute = true;
	issuer: string;
	notifyEarner = true;

	issueBadgeFinished: Promise<unknown>;

	constructor(
		protected badgeInstanceManager: BadgeInstanceManager,
		protected sessionService: SessionService,
		protected router: Router,
		protected route: ActivatedRoute,
		protected messageService: MessageService,
		protected formBuilder: FormBuilder,
		protected title: Title,
	) {
		super(router, route, sessionService);
		this.enableActionButton();
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

		const assertions: BadgeInstanceBatchAssertion[] = [];
		const recipientProfileContextUrl = 'https://openbadgespec.org/extensions/recipientProfile/context.json';
		this.transformedImportData.validRowsTransformed.forEach((row) => {
			let assertion: BadgeInstanceBatchAssertion;

			const extensions = row.name
				? {
						'extensions:recipientProfile': {
							'@context': recipientProfileContextUrl,
							type: ['Extension', 'extensions:RecipientProfile'],
							name: striptags(row.name),
						},
					}
				: undefined;

			if (row.evidence) {
				assertion = {
					recipient_identifier: row.email,
					evidence_items: [{ evidence_url: row.evidence }],
					extensions: extensions,
				};
			} else {
				assertion = {
					recipient_identifier: row.email,
					extensions: extensions,
				};
			}
			assertions.push(assertion);
		});

		this.badgeInstanceManager
			.createBadgeInstanceBatched(this.issuerSlug, this.badgeSlug, {
				issuer: this.issuerSlug,
				badge_class: this.badgeSlug,
				create_notification: this.notifyEarner,
				assertions,
			})
			.then(
				(result) => {
					this.openSuccessDialog(assertions.length + " User")
					this.router.navigate(['/issuer/issuers', this.issuerSlug, 'badges', this.badgeSlug]);
				},
				(error) => {
					this.messageService.setMessage(
						'Unable to award badge: ' + BadgrApiFailure.from(error).firstMessage,
						'error',
					);
				},
			);
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

	notifyChange(value) {
		this.notifyEarner = value;
	}

	private readonly _hlmDialogService = inject(HlmDialogService);
	public openSuccessDialog(recipient) {
		const dialogRef = this._hlmDialogService.open(SuccessDialogComponent, {
			context: {
				recipient: recipient,
				variant: "success"
			},
		});
	}
}
