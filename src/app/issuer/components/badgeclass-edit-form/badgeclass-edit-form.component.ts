import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AbstractControl, FormBuilder, Validators, ValidatorFn, ValidationErrors } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Md5 } from 'ts-md5/dist/md5';

import { BaseAuthenticatedRoutableComponent } from '../../../common/pages/base-authenticated-routable.component';

import { SessionService } from '../../../common/services/session.service';
import { MessageService } from '../../../common/services/message.service';

import {
	ApiBadgeClassForCreation,
	BadgeClassCategory,
	BadgeClassExpiresDuration,
	BadgeClassLevel,
} from '../../models/badgeclass-api.model';
import { BadgeClassManager } from '../../services/badgeclass-manager.service';
import { IssuerManager } from '../../services/issuer-manager.service';
import { BadgeStudioComponent } from '../badge-studio/badge-studio.component';
import { BgFormFieldImageComponent } from '../../../common/components/formfield-image';
import { UrlValidator } from '../../../common/validators/url.validator';
import { CommonDialogsService } from '../../../common/services/common-dialogs.service';
import { BadgeClass } from '../../models/badgeclass.model';
import { AppConfigService } from '../../../common/app-config.service';
import { typedFormGroup } from '../../../common/util/typed-forms';
import { CollectionBadgeSelectionDialog } from '../collectionbadge-selection-dialog/collectionbadgebadge-selection-dialog.component';
import { CollectionBadge } from '../../models/collectionbadge.model';

@Component({
	selector: 'badgeclass-edit-form',
	templateUrl: './badgeclass-edit-form.component.html',
})
export class BadgeClassEditFormComponent extends BaseAuthenticatedRoutableComponent implements OnInit {
	baseUrl: string;

	@Input()
	set badgeClass(badgeClass: BadgeClass) {
		if (this.existingBadgeClass !== badgeClass) {
			this.existingBadgeClass = badgeClass;
			this.existing = true;
			this.initFormFromExisting(this.existingBadgeClass);
		}
	}

	@Input()
	set initBadgeClass(badgeClass: BadgeClass) {
		if (this.initialisedBadgeClass !== badgeClass) {
			this.initialisedBadgeClass = badgeClass;
			this.initFormFromExisting(this.initialisedBadgeClass);
		}
	}

	/**
	 * Wether or not the badge class that is being worked on is forked.
	 * This field is required to reduce the possibility of misordering @link initBadgeClass and isForked
	 * calls (isForked has to be set first).
	 * If not set, an error is logged and it is interpreted as `false`.
	 */
	@Input()
	set isForked(isBadgeClassForked: boolean | string) {
		// Parameters from HTML are passed as string, even if the type of the parameter
		// is set to boolean
		if (typeof isBadgeClassForked == 'string') isBadgeClassForked = isBadgeClassForked == 'true';
		this.isBadgeClassForked = isBadgeClassForked;
	}

	get badgeClass() {
		return this.initialisedBadgeClass ? this.initialisedBadgeClass : this.existingBadgeClass;
	}

	get alignmentFieldDirty() {
		return (
			this.badgeClassForm.controls.badge_criteria_text.dirty ||
			this.badgeClassForm.controls.badge_criteria_url.dirty
		);
	}

	readonly badgeClassPlaceholderImageUrl = '../../../../breakdown/static/images/placeholderavatar.svg';

	/**
	 * The name the badge is not allowed to have.
	 * This is used to enforce a change of the pattern when forking a badge.
	 */
	forbiddenName: string | null = null;
	/**
	 * The image the badge is not allowed to have.
	 * This is used to enforce a change of the pattern when forking a badge.
	 */
	forbiddenImage: string | null = null;

	/**
	 * Indicates wether the existing tags are currently being loaded.
	 * It is set in @see fetchTags
	 */
	existingTagsLoading: boolean;

	/**
	 * The already existing tags for other badges, for the autocomplete to show.
	 * The tags are loaded in @see fetchTags
	 */
	existingTags: object[];

	/**
	 * Indicates whether hexagon frame is shown or hidden
	 */
	hideHexFrame: boolean = false;

	savePromise: Promise<BadgeClass> | null = null;
	badgeClassForm = typedFormGroup(this.criteriaRequired.bind(this))
		.addControl('badge_name', '', [
			Validators.required,
			Validators.maxLength(255),
			// Validation that the name of a fork changed
			(control: AbstractControl): ValidationErrors | null =>
				this.forbiddenName && this.forbiddenName == control.value
					? { mustChange: { value: control.value } }
					: null,
		])
		.addControl('badge_image', '', [
			Validators.required,
			// Validation that the image (hash) of a fork changed
			(control: AbstractControl): ValidationErrors | null => {
				if (!control.value || !this.forbiddenImage || !this.currentImage) return null;
				let other = new Md5().appendStr(this.currentImage).end();
				if (this.forbiddenImage != other) return null;
				return { mustChange: { value: this.currentImage } };
			},
		])
		.addControl('badge_description', '', Validators.required)
		.addControl('badge_criteria_url', '')
		.addControl('badge_criteria_text', '')
		.addControl('badge_study_load', 1, [Validators.required, this.positiveInteger, Validators.max(1000)])
		.addControl('badge_category', '', Validators.required)
		.addControl('badge_level', 'a1', Validators.required)
		.addControl('badge_based_on', {
			slug: '',
			issuerSlug: '',
		})
		.addArray(
			'alignments',
			typedFormGroup()
				.addControl('target_name', '', Validators.required)
				.addControl('target_url', '', [Validators.required, UrlValidator.validUrl])
				.addControl('target_description', '')
				.addControl('target_framework', '')
				.addControl('target_code', ''),
		);

	@ViewChild('collectionBadgeDialog')
	collectionBadgeDialog: CollectionBadgeSelectionDialog;

	@ViewChild('badgeStudio')
	badgeStudio: BadgeStudioComponent;

	@ViewChild('imageField')
	imageField: BgFormFieldImageComponent;

	@ViewChild('newTagInput')
	newTagInput: ElementRef<HTMLInputElement>;

	@ViewChild('formElem')
	formElem: ElementRef<HTMLFormElement>;

	existingBadgeClass: BadgeClass | null = null;

	initialisedBadgeClass: BadgeClass | null = null;

	isCollectionBadgeChecked: boolean = false;
	badgeClassesLoadedPromise: Promise<unknown>;
	badgeClasses: BadgeClass[] | null;
	collectionBadge: CollectionBadge = new CollectionBadge(null);
	selectedBadgeClasses: BadgeClass[] = [];

	/**
	 * Indicates wether or not the @link initialisedBadgeClass is forked
	 */
	isBadgeClassForked: boolean | null = null;

	@Output()
	save = new EventEmitter<Promise<BadgeClass>>();

	@Output()
	cancel = new EventEmitter<void>();

	@Input()
	issuerSlug: string;

	@Input()
	submitText: string;

	@Input()
	submittingText: string;

	@Input()
	scrolled: boolean;

	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Tags
	tagsEnabled = false;
	tags = new Set<string>();

	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Expiration
	expirationEnabled = false;
	expirationForm = typedFormGroup()
		.addControl('expires_amount', '', [Validators.required, this.positiveInteger, Validators.max(1000)])
		.addControl('expires_duration', '', Validators.required);

	durationOptions: { [key in BadgeClassExpiresDuration]: string } = {
		days: 'Days',
		weeks: 'Weeks',
		months: 'Months',
		years: 'Years',
	};

	categoryOptions: { [key in BadgeClassCategory]: string } = {
		membership: 'Mitgliedschaft',
		ability: 'Metakompetenz',
		archievement: 'Teilnahme / Erfolg',
		skill: 'Fachliche Kompetenz',
	};

	levelOptions: { [key in BadgeClassLevel]: string } = {
		a1: 'A1 Einsteiger*in',
		a2: 'A2 Entdecker*in',
		b1: 'B1 Insider*in',
		b2: 'B2 Expert*in',
		c1: 'C1 Leader*in',
		c2: 'C2 Vorreiter*in',
	};

	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Alignments
	alignmentsEnabled = false;
	showAdvanced: boolean[] = [false];

	currentImage;
	initedCurrentImage = false;
	existing = false;
	showLegend = false;

	constructor(
		sessionService: SessionService,
		router: Router,
		route: ActivatedRoute,
		protected fb: FormBuilder,
		protected title: Title,
		protected messageService: MessageService,
		protected issuerManager: IssuerManager,
		private configService: AppConfigService,
		protected badgeClassManager: BadgeClassManager,
		protected dialogService: CommonDialogsService,
		protected componentElem: ElementRef<HTMLElement>,
	) {
		super(router, route, sessionService);
		title.setTitle(`Create Badge - ${this.configService.theme['serviceName'] || 'Badgr'}`);

		this.baseUrl = this.configService.apiConfig.baseUrl;

		this.badgeClassesLoadedPromise = this.badgeClassManager.allBadgesList.loadedPromise
			.then((list) => {
				this.badgeClasses = list.entities;
				return this.badgeClasses;
			})
			.catch((err) => {
				router.navigate(['/']);
				return this.messageService.reportHandledError(' Failed to load badgeClasses');
			});
	}

	initFormFromExisting(badgeClass: BadgeClass) {
		if (!badgeClass) return;

		if (this.isBadgeClassForked === null) {
			console.error('Missing information on wether the init badge is forked!');
			this.isBadgeClassForked = false;
		}

		if (this.isBadgeClassForked) {
			// Store the "old" name and image (hash) to later verify that it changed
			this.forbiddenName = badgeClass.name;
			this.forbiddenImage = badgeClass.extension['extensions:OrgImageExtension']?.OrgImage
				? new Md5().appendStr(badgeClass.extension['extensions:OrgImageExtension'].OrgImage).end()
				: null;
		} else {
			this.forbiddenName = null;
			this.forbiddenImage = null;
		}

		this.badgeClassForm.setValue({
			badge_name: badgeClass.name,
			badge_image: this.existing ? badgeClass.image : null, // Setting the image here is causing me a lot of problems with events being triggered, so I resorted to just set it in this.imageField...
			badge_description: badgeClass.description,
			badge_criteria_url: badgeClass.criteria_url,
			badge_criteria_text: badgeClass.criteria_text,
			badge_study_load: badgeClass.extension['extensions:StudyLoadExtension']
				? badgeClass.extension['extensions:StudyLoadExtension'].StudyLoad
				: null,
			badge_category: badgeClass.extension['extensions:CategoryExtension']
				? badgeClass.extension['extensions:CategoryExtension'].Category
				: null,
			badge_level: badgeClass.extension['extensions:LevelExtension']
				? badgeClass.extension['extensions:LevelExtension'].Level
				: null,
			badge_based_on: {
				slug: badgeClass.slug,
				issuerSlug: badgeClass.issuerSlug,
			},
			alignments: this.badgeClass.alignments.map((alignment) => ({
				target_name: alignment.target_name,
				target_url: alignment.target_url,
				target_description: alignment.target_description,
				target_framework: alignment.target_framework,
				target_code: alignment.target_code,
			})),
		});

		this.currentImage = badgeClass.extension['extensions:OrgImageExtension']
			? badgeClass.extension['extensions:OrgImageExtension'].OrgImage
			: undefined;
		if (this.currentImage && this.imageField) {
			this.imageField.useDataUrl(this.currentImage, 'BADGE');
		}
		this.tags = new Set();
		this.badgeClass.tags.forEach((t) => this.tags.add(t));

		this.tagsEnabled = this.tags.size > 0;
		this.alignmentsEnabled = this.badgeClass.alignments.length > 0;
		if (badgeClass.expiresAmount && badgeClass.expiresDuration) {
			this.enableExpiration();
		}

		this.adjustUploadImage(this.badgeClassForm.value);
	}

	ngOnInit() {
		super.ngOnInit();
		let that = this;
		// update badge frame when a category is selected, unless no-hexagon-frame checkbox is checked
		this.badgeClassForm.rawControl.controls['badge_category'].statusChanges.subscribe((res) => {
			if (this.currentImage && !this.hideHexFrame) {
				//timeout because of workaround for angular bug.
				setTimeout(function () {
					that.adjustUploadImage(that.badgeClassForm.value);
				}, 10);
			}
		});
		// update badge frame when a level is selected, unless no-hexagon-frame checkbox is checked
		this.badgeClassForm.rawControl.controls['badge_level'].statusChanges.subscribe((res) => {
			if (this.currentImage && !this.hideHexFrame) {
				//timeout because of workaround for angular bug.
				setTimeout(function () {
					that.adjustUploadImage(that.badgeClassForm.value);
				}, 10);
			}
		});

		this.fetchTags();
	}

	/**
	 * Fetches the tags from the @see badgeClassManager and selects the tags from them.
	 * The tags are then assigned to @see existingTags in an appropriate format.
	 * At the beginning, @see existingTagsLoading is set, once tags are loaded it's unset.
	 */
	fetchTags() {
		this.existingTags = [];
		this.existingTagsLoading = true;
		// outerThis is needed because inside the observable, `this` is something else
		let outerThis = this;
		let observable = this.badgeClassManager.allBadges$;

		observable.subscribe({
			next(entities: BadgeClass[]) {
				let tags: string[] = entities.flatMap((entity) => entity.tags);
				let unique = [...new Set(tags)];
				unique.sort();
				outerThis.existingTags = unique.map((tag, index) => ({
					id: index,
					name: tag,
				}));
				// The tags are loaded in one badge, so it's save to assume
				// that after the first `next` call, the loading is done
				outerThis.existingTagsLoading = false;
			},
			error(err) {
				console.error("Couldn't fetch labels: " + err);
			},
		});
	}

	enableTags() {
		this.tagsEnabled = true;
	}

	disableTags() {
		this.tagsEnabled = false;
	}

	addTag() {
		const newTag = (this.newTagInput['query'] || '').trim().toLowerCase();

		if (newTag.length > 0) {
			this.tags.add(newTag);
			this.newTagInput['query'] = '';
		}
	}

	handleTagInputKeyPress(event: KeyboardEvent) {
		if (event.keyCode === 13 /* Enter */) {
			this.addTag();
			this.newTagInput.nativeElement.focus();
			event.preventDefault();
		}
	}

	manageBadges() {
		this.collectionBadgeDialog
			.openDialog({
				dialogId: 'manage-collectionBadge-selected-badges',
				dialogTitle: 'Add Badges',
				multiSelectMode: true,
			})
			.then((selectedBadges) => {
				const badgeCollection = selectedBadges.concat(this.collectionBadge.badges);
				this.selectedBadgeClasses = badgeCollection;
			});
	}

	removeTag(tag: string) {
		this.tags.delete(tag);
	}

	enableExpiration() {
		const initialAmount = this.badgeClass ? this.badgeClass.expiresAmount : '';
		const initialDuration = this.badgeClass ? this.badgeClass.expiresDuration || '' : '';

		this.expirationEnabled = true;

		this.expirationForm.setValue({
			expires_amount: initialAmount.toString(),
			expires_duration: initialDuration.toString(),
		});
	}

	disableExpiration() {
		this.expirationEnabled = false;
		this.expirationForm.reset();
	}

	enableAlignments() {
		this.alignmentsEnabled = true;
		if (this.badgeClassForm.controls.alignments.length === 0) {
			this.addAlignment();
		}
	}

	addAlignment() {
		this.badgeClassForm.controls.alignments.addFromTemplate();
	}

	async disableAlignments() {
		const isPlural = this.badgeClassForm.value.alignments.length > 1;
		if (
			!(await this.dialogService.confirmDialog.openTrueFalseDialog({
				dialogTitle: `Remove Alignment${isPlural ? 's' : ''}?`,
				dialogBody: `Are you sure you want to remove ${
					isPlural ? 'these alignments?' : 'this alignment?'
				} This action cannot be undone.`,
				resolveButtonLabel: 'Remove',
				rejectButtonLabel: 'Cancel',
			}))
		) {
			return;
		}
		this.alignmentsEnabled = false;
		this.badgeClassForm.setValue({
			...this.badgeClassForm.value,
			alignments: [],
		});
	}

	async removeAlignment(alignment: this['badgeClassForm']['controls']['alignments']['controls'][0]) {
		const value = alignment.value;

		if (
			(value.target_name || '').trim().length > 0 ||
			(value.target_url || '').trim().length > 0 ||
			(value.target_description || '').trim().length > 0 ||
			(value.target_framework || '').trim().length > 0 ||
			(value.target_code || '').trim().length > 0
		) {
			if (
				!(await this.dialogService.confirmDialog.openTrueFalseDialog({
					dialogTitle: 'Remove Alignment?',
					dialogBody: 'Are you sure you want to remove this alignment? This action cannot be undone.',
					resolveButtonLabel: 'Remove Alignment',
					rejectButtonLabel: 'Cancel',
				}))
			) {
				return;
			}
		}

		this.badgeClassForm.controls.alignments.removeAt(
			this.badgeClassForm.controls.alignments.controls.indexOf(alignment),
		);
	}

	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	criteriaRequired(): { [id: string]: boolean } | null {
		if (!this.badgeClassForm) return null;

		const value = this.badgeClassForm.value;

		const criteriaUrl = (value.badge_criteria_url || '').trim();
		const criteriaText = (value.badge_criteria_text || '').trim();

		if (!criteriaUrl.length && !criteriaText.length) {
			return { criteriaRequired: true };
		} else {
			return null;
		}
	}

	async onSubmit() {
		if (this.isCollectionBadgeChecked) {
			let collectionBadgeData = {
				name: this.badgeClassForm.value.badge_name,
				description: this.badgeClassForm.value.badge_description ?? '',
				image: this.badgeClassForm.value.badge_image ?? '',
				slug: this.badgeClassForm.value.badge_name,
				badges: this.selectedBadgeClasses.map((item) => {
					return {
						slug: item.apiModel.slug,
					};
				}),
			};
			this.badgeClassManager.createCollectionBadgeClass(collectionBadgeData);
			return null;
		}
		this.badgeClassForm.markTreeDirty();
		if (this.expirationEnabled) {
			this.expirationForm.markTreeDirty();
		}

		if (!this.badgeClassForm.valid || (this.expirationEnabled && !this.expirationForm.valid)) {
			const firstInvalidInput = this.formElem.nativeElement.querySelector(
				'.ng-invalid,.dropzone-is-error,.u-text-error',
			);
			if (firstInvalidInput) {
				if (typeof firstInvalidInput['focus'] === 'function') {
					firstInvalidInput['focus']();
				}

				firstInvalidInput.scrollIntoView({ behavior: 'smooth' });
			}
			return;
		}

		const formState = this.badgeClassForm.value;
		const expirationState = this.expirationEnabled ? this.expirationForm.value : undefined;

		const studyLoadExtensionContextUrl = `${this.baseUrl}/static/extensions/StudyLoadExtension/context.json`;
		const categoryExtensionContextUrl = `${this.baseUrl}/static/extensions/CategoryExtension/context.json`;
		const levelExtensionContextUrl = `${this.baseUrl}/static/extensions/LevelExtension/context.json`;
		const basedOnExtensionContextUrl = `${this.baseUrl}/static/extensions/BasedOnExtension/context.json`;
		const orgImageExtensionContextUrl = `${this.baseUrl}/static/extensions/OrgImageExtension/context.json`;

		if (this.existingBadgeClass) {
			this.existingBadgeClass.name = formState.badge_name;
			this.existingBadgeClass.description = formState.badge_description;
			this.existingBadgeClass.image = formState.badge_image;
			this.existingBadgeClass.criteria_text = formState.badge_criteria_text;
			this.existingBadgeClass.criteria_url = formState.badge_criteria_url;
			this.existingBadgeClass.alignments = this.alignmentsEnabled ? formState.alignments : [];
			this.existingBadgeClass.tags = this.tagsEnabled ? Array.from(this.tags) : [];
			this.existingBadgeClass.extension = {
				...this.existingBadgeClass.extension,
				'extensions:StudyLoadExtension': {
					'@context': studyLoadExtensionContextUrl,
					type: ['Extension', 'extensions:StudyLoadExtension'],
					StudyLoad: Number(formState.badge_study_load),
				},
				'extensions:CategoryExtension': {
					'@context': categoryExtensionContextUrl,
					type: ['Extension', 'extensions:CategoryExtension'],
					Category: String(formState.badge_category),
				},
				'extensions:LevelExtension': {
					'@context': levelExtensionContextUrl,
					type: ['Extension', 'extensions:LevelExtension'],
					Level: String(formState.badge_level),
				},
			};
			if (this.currentImage) {
				this.existingBadgeClass.extension = {
					...this.existingBadgeClass.extension,
					'extensions:OrgImageExtension': {
						'@context': orgImageExtensionContextUrl,
						type: ['Extension', 'extensions:OrgImageExtension'],
						OrgImage: this.currentImage,
					},
				};
			}
			if (this.expirationEnabled) {
				this.existingBadgeClass.expiresDuration = expirationState.expires_duration as BadgeClassExpiresDuration;
				this.existingBadgeClass.expiresAmount = parseInt(expirationState.expires_amount, 10);
			} else {
				this.existingBadgeClass.clearExpires();
			}

			this.savePromise = this.existingBadgeClass.save();
		} else {
			let badgeClassData = {
				name: formState.badge_name,
				description: formState.badge_description,
				image: formState.badge_image,
				criteria_text: formState.badge_criteria_text,
				criteria_url: formState.badge_criteria_url,
				tags: this.tagsEnabled ? Array.from(this.tags) : [],
				alignment: this.alignmentsEnabled ? formState.alignments : [],
				extensions: {
					'extensions:StudyLoadExtension': {
						'@context': studyLoadExtensionContextUrl,
						type: ['Extension', 'extensions:StudyLoadExtension'],
						StudyLoad: Number(formState.badge_study_load),
					},
					'extensions:CategoryExtension': {
						'@context': categoryExtensionContextUrl,
						type: ['Extension', 'extensions:CategoryExtension'],
						Category: String(formState.badge_category),
					},
					'extensions:LevelExtension': {
						'@context': levelExtensionContextUrl,
						type: ['Extension', 'extensions:LevelExtension'],
						Level: String(formState.badge_level),
					},
					'extensions:BasedOnExtension': {
						'@context': basedOnExtensionContextUrl,
						type: ['Extension', 'extensions:BasedOnExtension'],
						BasedOn: formState.badge_based_on,
					},
				},
			} as ApiBadgeClassForCreation;
			if (this.currentImage) {
				badgeClassData.extensions = {
					...badgeClassData.extensions,
					'extensions:OrgImageExtension': {
						'@context': orgImageExtensionContextUrl,
						type: ['Extension', 'extensions:OrgImageExtension'],
						OrgImage: this.currentImage,
					},
				};
			}
			if (this.expirationEnabled) {
				badgeClassData.expires = {
					duration: expirationState.expires_duration as BadgeClassExpiresDuration,
					amount: parseInt(expirationState.expires_amount, 10),
				};
			}

			this.savePromise = this.badgeClassManager.createBadgeClass(this.issuerSlug, badgeClassData);
		}

		this.save.emit(this.savePromise);
	}

	cancelClicked() {
		this.cancel.emit();
	}

	generateRandomImage() {
		this.badgeStudio
			.generateRandom()
			.then((imageUrl) => this.imageField.useDataUrl(imageUrl, 'Auto-generated image'));
	}

	generateUploadImage(image, formdata) {
		// the imageUploaded-event of the angular image component is also called after initialising the component because the image is set in initFormFromExisting
		if (typeof this.currentImage == 'undefined' || this.initedCurrentImage) {
			this.initedCurrentImage = true;
			this.currentImage = image.slice();
			// Hide hexagon-frame if checkbox is checked
			if (this.hideHexFrame) {
				this.imageField.useDataUrl(this.currentImage, 'BADGE');
			} else {
				this.badgeStudio
					.generateUploadImage(image.slice(), formdata)
					.then((imageUrl) => this.imageField.useDataUrl(imageUrl, 'BADGE'));
			}
		} else {
			this.initedCurrentImage = true;
		}
	}
	adjustUploadImage(formdata) {
		// Skip update badge icon frame if no-hexagon-frame checkbox is checked
		if (this.currentImage && this.badgeStudio && !this.hideHexFrame) {
			this.badgeStudio
				.generateUploadImage(this.currentImage.slice(), formdata)
				.then((imageUrl) => this.imageField.useDataUrl(imageUrl, 'BADGE'));
		}
	}

	positiveInteger(control: AbstractControl) {
		const val = parseInt(control.value, 10);
		if (isNaN(val) || val < 1) {
			return { expires_amount: 'Must be a positive integer' };
		}
	}

	closeLegend() {
		this.showLegend = false;
	}

	openLegend() {
		this.showLegend = true;
	}

	handleCBoxValueChange(event: Event) {
		this.hideHexFrame = (<HTMLInputElement>event.target).checked;

		if (this.currentImage) {
			if (this.hideHexFrame) {
				this.imageField.useDataUrl(this.currentImage, 'BADGE');
			} else {
				this.badgeStudio
					.generateUploadImage(this.currentImage, this.badgeClassForm.value)
					.then((imageUrl) => this.imageField.useDataUrl(imageUrl, 'BADGE'));
			}
		}
	}
}
