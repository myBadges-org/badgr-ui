import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from '../../../common/services/message.service';
import { Title } from '@angular/platform-browser';
import { RecipientBadgeSelectionDialog } from '../recipient-badge-selection-dialog/recipient-badge-selection-dialog.component';
import { RecipientBadgeCollection, RecipientBadgeCollectionEntry } from '../../models/recipient-badge-collection.model';
import { RecipientBadgeCollectionManager } from '../../services/recipient-badge-collection-manager.service';
import { RecipientBadgeManager } from '../../services/recipient-badge-manager.service';
import { CommonDialogsService } from '../../../common/services/common-dialogs.service';
import { BaseAuthenticatedRoutableComponent } from '../../../common/pages/base-authenticated-routable.component';
import { SessionService } from '../../../common/services/session.service';
import { ShareSocialDialogOptions } from '../../../common/dialogs/share-social-dialog/share-social-dialog.component';
import { addQueryParamsToUrl } from '../../../common/util/url-util';
import { AppConfigService } from '../../../common/app-config.service';
import { LinkEntry } from '../../../common/components/bg-breadcrumbs/bg-breadcrumbs.component';

@Component({
	selector: 'recipient-earned-badge-detail',
	templateUrl: 'recipient-badge-collection-detail.component.html',
})
export class RecipientBadgeCollectionDetailComponent extends BaseAuthenticatedRoutableComponent implements OnInit {
	readonly badgeLoadingImageUrl = '../../../../breakdown/static/images/badge-loading.svg';
	readonly badgeFailedImageUrl = '../../../../breakdown/static/images/badge-failed.svg';
	readonly noBadgesImageUrl = '../../../../assets/@concentricsky/badgr-style/dist/images/image-empty-backpack.svg';
	readonly noCollectionsImageUrl =
		'../../../../assets/@concentricsky/badgr-style/dist/images/image-empty-collection.svg';

	@ViewChild('recipientBadgeDialog')
	recipientBadgeDialog: RecipientBadgeSelectionDialog;

	collectionLoadedPromise: Promise<unknown>;
	collection: RecipientBadgeCollection = new RecipientBadgeCollection(null);
	crumbs: LinkEntry[];

	constructor(
		router: Router,
		route: ActivatedRoute,
		loginService: SessionService,
		private title: Title,
		private messageService: MessageService,
		private recipientBadgeManager: RecipientBadgeManager,
		private recipientBadgeCollectionManager: RecipientBadgeCollectionManager,
		private configService: AppConfigService,
		private dialogService: CommonDialogsService
	) {
		super(router, route, loginService);

		title.setTitle(`Sammlungen - ${this.configService.theme['serviceName'] || 'Badgr'}`);

		this.collectionLoadedPromise = Promise.all([
			this.recipientBadgeCollectionManager.recipientBadgeCollectionList.loadedPromise,
			this.recipientBadgeManager.recipientBadgeList.loadedPromise,
		])
			.then(([list]) => {
				this.collection = list.entityForSlug(this.collectionSlug);
				this.crumbs = [
					{ title: 'Sammlungen', routerLink: ['/recipient/badge-collections'] },
					{ title: this.collection.name, routerLink: ['/collection/' + this.collection.slug] },
				];
				return this.collection;
			})
			.then((collection) => collection.badgesPromise)
			.catch((err) => {
				router.navigate(['/']);
				return this.messageService.reportHandledError(
					`Fehler beim Laden der Sammlung '${this.collectionSlug}'`
				);
			});
	}

	get collectionSlug(): string {
		return this.route.snapshot.params['collectionSlug'];
	}

	ngOnInit() {
		super.ngOnInit();
	}

	manageBadges() {
		this.recipientBadgeDialog
			.openDialog({
				dialogId: 'manage-collection-badges',
				dialogTitle: 'Badge Hinzufügen',
				multiSelectMode: true,
				restrictToIssuerId: null,
				omittedCollection: this.collection.badges,
			})
			.then((selectedBadges) => {
				const badgeCollection = selectedBadges.concat(this.collection.badges);

				badgeCollection.forEach((badge) => badge.markAccepted());

				this.collection.updateBadges(badgeCollection);
				this.collection.save().then(
					(success) =>
						this.messageService.reportMinorSuccess(`Sammlung '${this.collection.name}' gespeichert`),
					(failure) => this.messageService.reportHandledError(`Fehler beim Speichern der Sammlung`, failure)
				);
			});
	}

	deleteCollection() {
		this.dialogService.confirmDialog
			.openResolveRejectDialog({
				dialogTitle: 'Sammlung Löschen',
				dialogBody: `Soll die Sammlung '${this.collection.name}' wirklich gelöscht werden?`,
				resolveButtonLabel: 'Sammlung Löschen',
				rejectButtonLabel: 'Abbrechen',
			})
			.then(
				() => {
					this.collection.deleteCollection().then(
						() => {
							this.messageService.reportMinorSuccess(`Sammlung '${this.collection.name}' wurde gelöscht`);
							this.router.navigate(['/recipient/badge-collections']);
						},
						(error) => this.messageService.reportHandledError(`Fehler beim Löschen der Sammlung`, error)
					);
				},
				() => {}
			);
	}

	removeEntry(entry: RecipientBadgeCollectionEntry) {
		this.dialogService.confirmDialog
			.openResolveRejectDialog({
				dialogTitle: 'Badge Entfernen',
				dialogBody: `Soll die Badge '${entry.badge.badgeClass.name}' wirklich aus der Sammlung '${this.collection.name}' entfernt werden?`,
				rejectButtonLabel: 'Abbrechen',
				resolveButtonLabel: 'Badge Entfernen',
			})
			.then(
				() => {
					this.collection.badgeEntries.remove(entry);
					this.collection.save().then(
						(success) =>
							this.messageService.reportMinorSuccess(
								`Badge '${entry.badge.badgeClass.name}' wurde aus der Sammlung '${this.collection.name}' entfernt.`
							),
						(failure) =>
							this.messageService.reportHandledError(
								`Fehler beim Entfernen der Badge '${entry.badge.badgeClass.name}' aus der Sammlung '${this.collection.name}'`,
								failure
							)
					);
				},
				() => {}
			);
	}

	cantExportPDFWhenPrivate() {
		this.dialogService.confirmDialog
			.openResolveRejectDialog({
				dialogTitle: 'Veröffentlichen Um Als PDF Zu Exportieren',
				dialogBody: `Um die Sammlung '${this.collection.name}' als PDF zu exportieren muss diese öffentlich sein. Soll die Sammlung veröffentlich werden?`,
				resolveButtonLabel: 'Sammlung Veröffentlichen',
				rejectButtonLabel: 'Abbrechen',
			})
			.then(
				() => {
					this.collectionPublished = true;
				},
				() => {}
			);
	}

	get badgesInCollectionCount(): string {
		return `${this.collection.badgeEntries.length} ${
			this.collection.badgeEntries.length === 1 ? 'Badge' : 'Badges'
		}`;
	}

	get collectionPublished() {
		return this.collection.published;
	}

	set collectionPublished(published: boolean) {
		this.collection.published = published;

		if (published) {
			this.collection.save().then(
				(success) =>
					this.messageService.reportMinorSuccess(`Sammlung '${this.collection.name}' wurde veröffentlicht`),
				(failure) =>
					this.messageService.reportHandledError(
						`Fehler beim Veröffentlichen der Sammlung '${this.collection.name}'`,
						failure
					)
			);
		} else {
			this.collection.save().then(
				(success) =>
					this.messageService.reportMinorSuccess(
						`Veröffentlichung der Sammlung '${this.collection.name}' wurde aufgehoben`
					),
				(failure) =>
					this.messageService.reportHandledError(
						`Fehler beim Zurücknehmen der Veröffentlichung der Sammlung '${this.collection.name}'`,
						failure
					)
			);
		}
	}

	shareCollection() {
		this.dialogService.shareSocialDialog.openDialog(shareCollectionDialogOptionsFor(this.collection));
	}

	exportPdf() {
		this.dialogService.exportPdfDialog
			.openDialogForCollections(this.collection)
			.catch((error) => console.log(error));
	}
}

export function shareCollectionDialogOptionsFor(collection: RecipientBadgeCollection): ShareSocialDialogOptions {
	return {
		title: 'Sammlung Teilen',
		shareObjectType: 'BadgeCollection',
		shareUrl: collection.shareUrl,
		shareTitle: collection.name,
		shareIdUrl: collection.url,
		shareSummary: collection.description,
		shareEndpoint: 'shareArticle',
		excludeServiceTypes: ['Pinterest'],

		embedOptions: [
			{
				label: 'Card',
				embedTitle: /*"Badge Collection: " +*/ collection.name,
				embedType: 'iframe',
				embedSize: { width: 330, height: 186 },
				embedVersion: 1,
				embedUrl: addQueryParamsToUrl(collection.shareUrl, { embed: true }),
				embedLinkUrl: null,
			},
		],
	};
}
