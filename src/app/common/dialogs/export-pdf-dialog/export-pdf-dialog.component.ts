import { Component, ElementRef, Renderer2, ViewChild, AfterViewInit } from '@angular/core';

import { BaseDialog } from '../base-dialog';
import { RecipientBadgeInstance } from '../../../recipient/models/recipient-badge.model';

import { jsPDF } from 'jspdf';
import { ApiRecipientBadgeClass, ApiRecipientBadgeIssuer } from '../../../recipient/models/recipient-badge-api.model';
import { RecipientBadgeCollection } from '../../../recipient/models/recipient-badge-collection.model';
import { UserProfile } from '../../model/user-profile.model';
import { loadImageURL, readFileAsDataURL } from '../../util/file-util';
import { UserProfileManager } from '../../services/user-profile-manager.service';
import { MessageService } from '../../services/message.service';

@Component({
	selector: 'export-pdf-dialog',
	templateUrl: 'export-pdf-dialog.component.html',
	styleUrls: ['export-pdf-dialog.component.css'],
})
export class ExportPdfDialog extends BaseDialog {
	badge: RecipientBadgeInstance | null = null;
	collection: RecipientBadgeCollection | null = null;
	badgeResults: BadgeResult[] | null = null;
	badgePdf: string | null = null;
	doc: jsPDF = null;
	docName: string = null;
	themeColor: string;
	pdfError: Error;

	profile: UserProfile;
	emailsLoaded: Promise<unknown>;

	imageLoader: (file: File | string) => Promise<string> = basicImageLoader;

	@ViewChild('outputPdf', { static: false }) outputElement: ElementRef;

	resolveFunc: () => void;
	rejectFunc: () => void;

	constructor(
		componentElem: ElementRef<HTMLElement>,
		renderer: Renderer2,
		protected profileManager: UserProfileManager,
		protected messageService: MessageService
	) {
		super(componentElem, renderer);
		var r = document.querySelector(':root');
		var rs = getComputedStyle(r);
		this.themeColor = rs.getPropertyValue('--color-interactive1');

		this.profileManager.userProfilePromise.then(
			(profile) => {
				this.profile = profile;
				this.emailsLoaded = profile.emails.loadedPromise;
			},
			(error) => this.messageService.reportAndThrowError('Failed to load userProfile', error)
		);

		this.docName = 'error';
	}

	async openDialog(badge: RecipientBadgeInstance, markdown: HTMLElement): Promise<void> {
		this.badge = badge;
		this.showModal();

		this.generateSingleBadgePdf(this.badge, markdown);

		return new Promise<void>((resolve, reject) => {
			this.resolveFunc = resolve;
			this.rejectFunc = reject;
		});
	}

	async openDialogForCollections(collection: RecipientBadgeCollection): Promise<void> {
		this.collection = collection;
		this.showModal();

		this.generateBadgeCollectionPdf(this.collection);

		return new Promise<void>((resolve, reject) => {
			this.resolveFunc = resolve;
			this.rejectFunc = reject;
		});
	}

	async openDialogForBackpack(badgeResults: BadgeResult[], profile: UserProfile): Promise<void> {
		this.badgeResults = badgeResults;
		this.showModal();

		this.generateBackpackPdf(this.badgeResults, profile);

		return new Promise<void>((resolve, reject) => {
			this.resolveFunc = resolve;
			this.rejectFunc = reject;
		});
	}

	closeDialog() {
		this.closeModal();
		this.resolveFunc();
	}

	async generateSingleBadgePdf(badge: RecipientBadgeInstance, markdown: HTMLElement) {
		this.pdfError = undefined;
		const badgeClass: ApiRecipientBadgeClass = badge.badgeClass;
		this.doc = new jsPDF();

		let yPos = 20;
		let xMargin = 10;

		const pageWidth = this.doc.internal.pageSize.getWidth();
		const pageHeight = this.doc.internal.pageSize.getHeight();
		let cutoff = pageWidth - 27;

		try {
			if (!this.profile) {
				await this.profileManager.userProfilePromise.then(
					(profile) => {
						debugger;
						this.profile = profile;
						this.emailsLoaded = profile.emails.loadedPromise;
					},
					(error) => this.messageService.reportAndThrowError('Failed to load userProfile', error)
				);
			}
			this.emailsLoaded.then(async () => {
				// image
				const canvasWidth = 100;
				const canvasHeight = 100;
				const marginXImage = (pageWidth - canvasWidth) / 2;
				let badge_img = new Image();
				badge_img.src = badgeClass.image;
				this.doc.addImage(badge_img, 'JPEG', marginXImage, yPos, canvasWidth, canvasHeight);

				// title
				yPos += canvasHeight;
				this.doc.setFontSize(32);
				this.doc.setFont('Helvetica', 'bold');
				let title = this.doc.splitTextToSize(badgeClass.name, cutoff - this.doc.getTextWidth('...'));
				let titlePadding = 0;
				let maxTitleRows = 2;
				if (title.length > maxTitleRows) {
					title[maxTitleRows - 1] = title[maxTitleRows - 1] + '...';
				} else if (title.length < maxTitleRows) {
					titlePadding = (15 / 2) * (maxTitleRows - title.length);
					yPos += titlePadding;
				}
				for (let i = 0; i < maxTitleRows; i = i + 1) {
					if (title[i]) {
						yPos += 15;
						this.doc.text(title[i], pageWidth / 2, yPos, {
							align: 'center',
						});
					}
				}
				yPos += titlePadding;

				// subtitle
				if (badgeClass.criteria_text) {
					yPos += 7;
					await this.doc.html(markdown, {
						callback: function (doc) {
							return doc;
						},
						x: 20,
						y: yPos,
						width: cutoff - 8, //target width in the PDF document
						windowWidth: 550, //window width in CSS pixels
					});
					yPos += 55 + 10;
					this.doc.setFillColor(255, 255, 255);
					this.doc.rect(0, yPos, pageWidth, pageHeight - yPos, 'F');
					yPos += 5;
				} else {
					yPos += 7;
					this.doc.setFontSize(20);
					this.doc.setFont('Helvetica', 'normal');
					let subtitle = this.doc.splitTextToSize(
						badgeClass.description,
						cutoff - this.doc.getTextWidth('...')
					);
					let subtitlePadding = 0;
					let maxSubtitleRows = 5;
					if (subtitle.length > maxSubtitleRows) {
						subtitle[maxSubtitleRows - 1] = subtitle[maxSubtitleRows - 1] + '...';
					} else if (subtitle.length < maxSubtitleRows) {
						subtitlePadding = (10 / 2) * (maxSubtitleRows - subtitle.length);
						yPos += subtitlePadding;
					}
					for (let i = 0; i < maxSubtitleRows; i = i + 1) {
						if (subtitle[i]) {
							yPos += 10;
							this.doc.text(subtitle[i], pageWidth / 2, yPos, {
								align: 'center',
							});
						}
					}
					yPos += subtitlePadding + 15;
				}

				// line
				this.doc.setDrawColor(this.themeColor);
				this.doc.setLineWidth(1.5);
				this.doc.line(25, yPos, pageWidth - 25, yPos);

				// edge line
				let edgeLineOffset = 8;
				this.doc.roundedRect(
					edgeLineOffset,
					edgeLineOffset,
					pageWidth - edgeLineOffset * 2,
					pageHeight - edgeLineOffset * 2,
					5,
					5
				);

				// awarded to
				yPos += 15;
				let name = '';
				if (
					this.profile &&
					((this.profile.firstName && this.profile.firstName.length > 0) ||
						(this.profile.lastName && this.profile.lastName.length > 0))
				) {
					if (this.profile.firstName) {
						name += this.profile.firstName + ' ';
					}
					if (this.profile.lastName) {
						name += this.profile.lastName;
					}
				} else {
					name = this.profile.emails.entities[0].email;
				}
				this.doc.setFontSize(18);
				this.doc.setFont('Helvetica', 'normal');
				let awardedToLength = this.doc.getTextWidth('Erlangt von: ');
				this.doc.setFontSize(20);
				this.doc.setFont('Helvetica', 'bold');
				let awardedToContentLength = this.doc.getTextWidth(name);
				if (awardedToContentLength + awardedToLength > cutoff) {
					name =
						this.doc.splitTextToSize(name, cutoff - awardedToLength - this.doc.getTextWidth('...'))[0] +
						'...';
					this.doc.setFontSize(20);
					this.doc.setFont('Helvetica', 'bold');
					awardedToContentLength = this.doc.getTextWidth(name);
				}
				this.doc.setFontSize(18);
				this.doc.setFont('Helvetica', 'normal');
				this.doc.text(
					'Erlangt von: ',
					pageWidth / 2 - (awardedToContentLength + awardedToLength) / 2,
					yPos,
					{}
				);
				this.doc.setFontSize(20);
				this.doc.setFont('Helvetica', 'bold');
				this.doc.text(
					name,
					pageWidth / 2 + (awardedToContentLength + awardedToLength) / 2 - awardedToContentLength,
					yPos,
					{}
				);

				// issued by
				yPos += 10;
				let issuedBy = badgeClass.issuer.name;
				this.doc.setFontSize(18);
				this.doc.setFont('Helvetica', 'normal');
				let issuedByLength = this.doc.getTextWidth('Vergeben von: ..');
				this.doc.setFontSize(20);
				this.doc.setFont('Helvetica', 'bold');
				let issuedByContentLength = this.doc.getTextWidth(issuedBy);
				if (issuedByContentLength + issuedByLength > cutoff) {
					issuedBy =
						this.doc.splitTextToSize(name, cutoff - awardedToLength - this.doc.getTextWidth('...'))[0] +
						'...';
					this.doc.setFontSize(20);
					this.doc.setFont('Helvetica', 'bold');
					issuedByContentLength = this.doc.getTextWidth(issuedBy);
				}
				this.doc.setFontSize(18);
				this.doc.setFont('Helvetica', 'normal');
				this.doc.text('Vergeben von: ', pageWidth / 2 - (issuedByLength + issuedByContentLength) / 2, yPos, {});
				this.doc.setFontSize(20);
				this.doc.setFont('Helvetica', 'bold');
				this.doc.text(
					issuedBy,
					pageWidth / 2 + (issuedByLength + issuedByContentLength) / 2 - issuedByContentLength,
					yPos,
					{}
				);

				// issued on
				yPos += 10;
				this.doc.setFontSize(20);
				this.doc.setFont('Helvetica', 'bold');
				let issuedOnContentLength = this.doc.getTextWidth(badge.issueDate.toLocaleDateString('uk-UK'));
				this.doc.setFontSize(18);
				this.doc.setFont('Helvetica', 'normal');
				let issuedOnLength = this.doc.getTextWidth('Erhalten am: ');
				this.doc.text('Erhalten am: ', pageWidth / 2 - (issuedOnLength + issuedOnContentLength) / 2, yPos, {});
				this.doc.setFontSize(20);
				this.doc.setFont('Helvetica', 'bold');
				this.doc.text(
					badge.issueDate.toLocaleDateString('uk-UK'),
					pageWidth / 2 + (issuedOnLength + issuedOnContentLength) / 2 - issuedOnContentLength,
					yPos,
					{}
				);

				// logo
				yPos += 9;
				const logoWidth = 15;
				const logoHeight = 15;
				this.doc.setFontSize(14);
				this.doc.setFont('Helvetica', 'normal');
				let logoTextOnContentLength = this.doc.getTextWidth('bereitgestellt von mybadges.org');
				const marginXImageLogo = (pageWidth - logoTextOnContentLength - logoWidth) / 2;
				var img = new Image();
				img.src = 'assets/logos/Badges_Entwurf-15.png';
				this.doc.addImage(img, 'PNG', marginXImageLogo, yPos, logoWidth, logoHeight);
				// yPos += 13;
				this.doc.textWithLink(
					'bereitgestellt von mybadges.org',
					(pageWidth - logoTextOnContentLength) / 2 + logoWidth,
					yPos + (logoHeight * 2) / 3,
					{
						url: 'https://mybadges.org/public/start',
					}
				);

				this.badgePdf = this.doc.output('datauristring');
				this.outputElement.nativeElement.src = this.badgePdf;

				this.outputElement.nativeElement.setAttribute('style', 'overflow: auto');
			});
		} catch (e) {
			this.pdfError = e;
			console.log(e);
		}

		this.docName = this.badge.badgeClass.name + ' - ' + dateToString(this.badge.issueDate, '');
	}

	generateBadgeCollectionPdf(collection: RecipientBadgeCollection) {
		this.pdfError = undefined;
		const badges: RecipientBadgeInstance[] = collection.badges;
		this.doc = new jsPDF();

		let badgesOnPage = 9;

		let yPos;
		let xMargin;

		try {
			for (let i = 0; i < badges.length / badgesOnPage; i++) {
				if (i > 0) {
					this.doc.addPage();
				}
				yPos = 15;
				xMargin = 10;
				const pageWidth = this.doc.internal.pageSize.getWidth();
				const pageHeight = this.doc.internal.pageSize.getHeight();
				const titleRectHeight = 53;
				let cutoff = pageWidth - 15;
				this.doc.setFillColor(this.themeColor);
				this.doc.rect(0, 0, pageWidth, titleRectHeight, 'F');
				// title
				this.doc.setFontSize(30);
				this.doc.setFont('Helvetica', 'bold');
				this.doc.setTextColor(255, 255, 255);
				let title = this.doc.splitTextToSize(collection.name, cutoff - this.doc.getTextWidth('...'));
				let titlePadding = 0;
				let maxTitleRows = 2;
				if (title.length > maxTitleRows) {
					title[maxTitleRows - 1] = title[maxTitleRows - 1] + '...';
				} else if (title.length < maxTitleRows) {
					titlePadding = (10 / 2) * (maxTitleRows - title.length);
					yPos += titlePadding;
				}
				for (let k = 0; k < maxTitleRows; k = k + 1) {
					if (title[k]) {
						if (k > 0) {
							yPos += 15;
						}
						this.doc.text(title[k], xMargin, yPos, {
							align: 'justify',
						});
					}
				}
				yPos += titlePadding;

				// subtitle
				// yPos += 7;
				this.doc.setFontSize(21);
				this.doc.setFont('Helvetica', 'normal');
				let subtitle = this.doc.splitTextToSize(collection.description, cutoff - this.doc.getTextWidth('...'));
				let subtitlePadding = 0;
				let maxSubtitleRows = 2;
				if (subtitle.length > maxSubtitleRows) {
					subtitle[maxSubtitleRows - 1] = subtitle[maxSubtitleRows - 1] + '...';
				} else if (subtitle.length < maxSubtitleRows) {
					subtitlePadding = (10 / 2) * (maxSubtitleRows - subtitle.length);
					yPos += subtitlePadding;
				}
				for (let k = 0; k < maxSubtitleRows; k = k + 1) {
					if (subtitle[k]) {
						yPos += 10;
						this.doc.text(subtitle[k], xMargin, yPos, {
							align: 'justify',
						});
					}
				}
				yPos = titleRectHeight;

				// Badges table title
				yPos += 10;
				this.doc.setFontSize(19);
				this.doc.setFont('Helvetica', 'bold');
				this.doc.setTextColor(0, 0, 0);
				this.doc.text('Collection', xMargin, yPos, {
					align: 'left',
				});
				let badgeText = '';
				if (badges.length / badgesOnPage > 1) {
					badgeText +=
						i * badgesOnPage +
						' bis ' +
						Math.min(badges.length, (i + 1) * badgesOnPage) +
						' von ' +
						badges.length +
						' Badges';
				} else {
					badgeText += badges.length + ' Badge';
					if (badges.length > 1) {
						badgeText += 's';
					}
				}

				this.doc.text(badgeText, pageWidth - xMargin, yPos, {
					align: 'right',
				});
				this.doc.line(xMargin, yPos + 3, pageWidth - xMargin, yPos + 3);

				// Badges table content
				yPos += 14;
				for (let j = 0 + badgesOnPage * i; j < Math.min(badges.length, badgesOnPage * (i + 1)); j++) {
					let badge = badges[j];
					// title
					this.doc.setFontSize(22);
					this.doc.setFont('Helvetica', 'bold');
					let badgeClass = badge.badgeClass;
					let xPos = xMargin;
					this.doc.addImage(badgeClass.image, 'png', xPos, yPos - 7, 18, 18);
					xPos += 20;
					let name = badgeClass.name;
					let nameSplit = this.doc.splitTextToSize(name, cutoff - this.doc.getTextWidth('...') - 20 - 20);
					if (nameSplit.length > 1) {
						nameSplit[0] += '...';
					}
					this.doc.text(nameSplit[0], xPos, yPos, {
						align: 'justify',
					});
					yPos += 9;
					// institution
					this.doc.setFontSize(14);
					this.doc.setFont('Helvetica', 'normal');
					let institution = badgeClass.issuer.name;
					if (this.doc.getTextWidth(institution) > cutoff - this.doc.getTextWidth('...') - 15 - 50) {
						// while(this.doc.getTextWidth(institution) > 30) {
						// 	institution = institution.substring(0, institution.length - 1);
						// }
						institution = institution.substring(
							0,
							institution.length -
								(this.doc.getTextWidth(institution) -
									(cutoff - this.doc.getTextWidth('...') - 15 - 50)) /
									2
						);
						institution += '...';
					}
					this.doc.text(institution, xPos, yPos, {
						align: 'justify',
					});
					let datum =
						badge.issueDate.getDate() +
						'.' +
						badge.issueDate.getMonth() +
						'.' +
						badge.issueDate.getFullYear();
					this.doc.text(datum, pageWidth - xMargin, yPos, {
						align: 'right',
					});
					yPos += 13;
				}

				// logo
				yPos = pageHeight - 25;
				const logoWidth = 15;
				const logoHeight = 15;
				this.doc.setFontSize(14);
				this.doc.setFont('Helvetica', 'normal');
				let logoTextOnContentLength = this.doc.getTextWidth('bereitgestellt von mybadges.org');
				const marginXImageLogo = (pageWidth - logoTextOnContentLength - logoWidth) / 2;
				var img = new Image();
				img.src = 'assets/logos/Badges_Entwurf-15.png';
				this.doc.addImage(img, 'PNG', marginXImageLogo, yPos, logoWidth, logoHeight);
				// yPos += 13;
				this.doc.textWithLink(
					'bereitgestellt von mybadges.org',
					(pageWidth - logoTextOnContentLength) / 2 + logoWidth,
					yPos + (logoHeight * 2) / 3,
					{
						url: 'https://mybadges.org/public/start',
					}
				);
			}
			this.badgePdf = this.doc.output('datauristring');
			this.outputElement.nativeElement.src = this.badgePdf;

			this.outputElement.nativeElement.setAttribute('style', 'overflow: auto');
		} catch (e) {
			this.pdfError = e;
			console.log(e);
		}

		this.docName = collection.name.substring(0, 80);
	}

	// disclaimer: unfinished
	generateBackpackPdf(badgeResults: BadgeResult[], profile: UserProfile) {
		this.pdfError = undefined;
		this.doc = new jsPDF();

		let yPos = 20;
		let xMargin = 10;

		try {
			// title
			this.doc.setFontSize(30);
			this.doc.setFont('Helvetica', 'bold');
			let title = 'Rucksack';
			if (profile.firstName != '') {
				title += ' von ' + profile.firstName + ' ' + profile.lastName;
			}
			this.doc.text(title, xMargin, yPos, {
				align: 'justify',
			});

			// Badges table title
			this.doc.setFontSize(17);
			let badgeText = '' + badgeResults.length + ' Badge';
			if (badgeResults.length > 1) {
				badgeText += 's:';
			} else {
				badgeText += ':';
			}
			yPos += 15;
			this.doc.text(badgeText, xMargin, yPos, {
				align: 'justify',
			});
			this.doc.line(xMargin, yPos + 1, xMargin + this.doc.getTextWidth(badgeText), yPos + 1);

			// Badges table header
			this.doc.setFontSize(14);
			yPos += 12;
			let headings = [
				{
					name: 'Badge',
					width: 80,
				},
				{
					name: 'Institution',
					width: 60,
				},
				{
					name: 'Vergeben',
					width: 60,
				},
			];
			let xPos = xMargin;
			headings.forEach((heading, i) => {
				this.doc.text(heading.name, xPos, yPos, {
					align: 'justify',
				});
				xPos += heading.width;
			});

			// Badges table content
			this.doc.setFont('Helvetica', 'normal');
			yPos += 12;
			badgeResults.forEach((badgeResult, _) => {
				let badgeClass = badgeResult.badge.badgeClass;
				let xPos = xMargin;
				this.doc.addImage(badgeClass.image, 'png', xPos, yPos - 7, 11, 11);
				xPos += 13;
				let name = badgeClass.name;
				let cutoff = 60;
				if (this.doc.getTextWidth(name) > cutoff) {
					// while(this.doc.getTextWidth(name) > 30) {
					// 	name = name.substring(0, name.length - 1);
					// }
					name = name.substring(0, name.length - (this.doc.getTextWidth(name) - cutoff) / 2);
					name += '...';
				}
				this.doc.text(name, xPos, yPos, {
					align: 'justify',
				});
				xPos += 80 * (12 / 14);
				let institution = badgeClass.issuer.name;
				cutoff = 50;
				if (this.doc.getTextWidth(institution) > cutoff) {
					// while(this.doc.getTextWidth(institution) > 30) {
					// 	institution = institution.substring(0, institution.length - 1);
					// }
					institution = institution.substring(
						0,
						institution.length - (this.doc.getTextWidth(institution) - cutoff) / 2
					);
					institution += '...';
				}
				this.doc.text(institution, xPos, yPos, {
					align: 'justify',
				});
				xPos += 70 * (12 / 14);
				let datum = dateToString(this.badge.issueDate, '.');
				this.doc.text(datum, xPos, yPos, {
					align: 'justify',
				});
				yPos += 12;
			});

			this.badgePdf = this.doc.output('datauristring');
			this.outputElement.nativeElement.src = this.badgePdf;
			this.outputElement.nativeElement.setAttribute('style', 'overflow: auto');
		} catch (e) {
			this.pdfError = e;
			console.log(e);
		}

		this.docName = 'Your backpack';
	}

	downloadPdf() {
		this.doc.save(this.docName + '.pdf');
	}
}

class BadgeResult {
	constructor(public badge: RecipientBadgeInstance, public issuer: ApiRecipientBadgeIssuer) {}
}

// TODO: put this in a service??
// file can either be file or url to a file
export function basicImageLoader(file: File | string): Promise<string> {
	if (typeof file == 'string') {
		return loadImageURL(file)
			.then(() => file)
			.catch((e) => {
				throw new Error(`${file} is not a valid image file`);
			});
	} else {
		return readFileAsDataURL(file)
			.then((url) => loadImageURL(url).then(() => url))
			.catch((e) => {
				throw new Error(`${file.name} is not a valid image file`);
			});
	}
}

function dateToString(date: Date, seperator: string) {
	return (
		('0' + date.getDate()).slice(-2) +
		seperator +
		('0' + (date.getMonth() + 1)).slice(-2) +
		seperator +
		date.getFullYear()
	);
}
