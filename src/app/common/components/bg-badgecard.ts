import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import { AUTO_STYLE, animate, state, style, transition, trigger } from '@angular/animations';
import { FormControl } from '@angular/forms';

@Component({
	selector: 'bg-badgecard',
	animations: [
		trigger('showCompetencies', [
			state('true', style({ height: AUTO_STYLE, visibility: AUTO_STYLE })),
			state('false', style({ height: '0', visibility: 'hidden' })),
			transition('false => true', animate(220 + 'ms ease-out')),
			transition('true => false', animate(220 + 'ms ease-in')),
		]),
	],
	host: {
		class: 'tw-rounded-[10px] tw-h-max tw-max-w-[450px] tw-border-purple tw-border-solid tw-border tw-relative tw-p-4 tw-block tw-overflow-hidden oeb-badge-card',
	},
	template: `
		<div
			class="tw-absolute tw-top-0 tw-left-0 tw-bg-purple tw-text-white tw-px-2 tw-py-1"
			*ngIf="mostRelevantStatus"
		>
			{{ mostRelevantStatus }}
		</div>

		<div class="tw-h-[100px]">
			<div class="tw-flex tw-items-center tw-h-full">
				<div
					*ngIf="completed"
					class="tw-absolute tw-top-[10px] tw-right-[10px] tw-flex tw-justify-center tw-items-center"
				>
					<div
						class="tw-bg-white tw-inline-flex tw-rounded-full tw-justify-center tw-items-center tw-border-solid tw-border-purple tw-border-[2px] "
					>
						<hlm-icon
							class="tw-text-purple tw-box-border md:tw-w-[22px] tw-w-[16px] md:tw-h-[22px] tw-h-[16px]"
							name="lucideCheck"
						/>
					</div>
				</div>
				<img
					class="oeb-badgeimage badgeimage-{{ mostRelevantStatus }}"
					[loaded-src]="badgeImage"
					[loading-src]="badgeLoadingImageUrl"
					[error-src]="badgeFailedImageUrl"
				/>
				<div class="tw-flex tw-flex-col tw-flex-wrap tw-pl-4 tw-py-2">
					<a
						*ngIf="badgeSlug && !publicUrl"
						class="tw-font-bold"
						[routerLink]="['../earned-badge', badgeSlug]"
						hlmP
						size="sm"
						>{{ badgeTitle }}</a
					>
					<a *ngIf="publicUrl" class="tw-font-bold" hlmP size="sm" [href]="publicUrl">{{ badgeTitle }}</a>

					<div class="tw-pt-2 tw-flex tw-flex-col tw-flex-wrap">
						<a
							hlmP
							size="sm"
							variant="light"
							*ngIf="issuerSlug; else noIssuerSlug"
							class="badgecard-x-issuer"
							[routerLink]="['../../public/issuers', issuerSlug]"
							>{{ issuerTitle }}</a
						>
						<ng-template #noIssuerSlug>
							<div class="badgecard-x-issuer">{{ issuerTitle }}</div>
						</ng-template>
						<time [date]="badgeIssueDate" format="dd.MM.y"></time>
					</div>

					<div class="tw-absolute tw-left-0 tw-bottom-2 tw-w-full">
						<!-- Show Verify or Share Button unless public -->
						<div class="tw-float-right tw-pr-4">
							<!-- <a
								hlmA
								hlmP
								size="sm"
								class="tw-font-bold tw-text-purple tw-no-underline"
								*ngIf="!verifyUrl && !public && mostRelevantStatus !== 'pending'"
								(click)="shareClicked.emit($event)"
							>
								{{ 'BadgeCollection.share' | translate }}
							</a> -->
							<a
								hlmA
								hlmP
								size="sm"
								class="tw-font-bold tw-text-purple tw-no-underline"
								*ngIf="verifyUrl"
								[href]="verifyUrl"
							>
								{{ 'RecBadgeDetail.verify' | translate }}
							</a>
						</div>
					</div>
				</div>
				<div
					class="tw-float-right tw-relative tw-ml-auto tw-flex tw-items-center tw-flex-col tw-mr-2 tw-h-full"
				>
					<oeb-checkbox
						[noMargin]="true"
						*ngIf="showCheckbox"
						[(ngModel)]="checked"
						(ngModelChange)="changeCheckbox($event)"
					></oeb-checkbox>
					<div
						*ngIf="competencies && competencies.length > 0"
						class="tw-absolute tw-bottom-0 tw-cursor-pointer"
						(click)="toggleCompetencies()"
					>
						<hlm-icon size="lg" [name]="showCompetencies ? 'lucideChevronUp' : 'lucideChevronDown'" />
					</div>
				</div>
			</div>
		</div>
		<div [@showCompetencies]="showCompetencies">
			<div class="tw-pt-8">
				<ng-container *ngIf="showCompetencies">
					<div *ngFor="let competency of competencies">
						<competency-accordion
							[name]="competency.name"
							[category]="competency.category"
							[description]="competency.description"
							[framework]="competency.framework" 
							[framework_identifier]="competency['framework_identifier']"
							[studyload]="competency.studyLoad | hourPipe"
						></competency-accordion>
					</div>
				</ng-container>
			</div>
		</div>
	`,
})
export class BgBadgecard {
	readonly badgeLoadingImageUrl = '../../../breakdown/static/images/badge-loading.svg';
	readonly badgeFailedImageUrl = '../../../breakdown/static/images/badge-failed.svg';
	@Input() badgeSlug: string;
	@Input() issuerSlug: string;
	@Input() publicUrl: string;
	@Input() badgeImage: string;
	@Input() badgeTitle: string;
	@Input() badgeDescription: string;
	@Input() badgeIssueDate: string;
	@Input() badgeClass: string;
	@Input() issuerTitle: string;
	@Input() mostRelevantStatus: 'expired' | 'new' | 'pending' | undefined;
	@Input() verifyUrl: string;
	@Input() public = false;
	@Input() competencies?: any[];
	@Input() checkboxControl?: FormControl;
	@Input() showCheckbox = false;
	@Output() shareClicked = new EventEmitter<MouseEvent>();
	@Input() completed: Boolean = false;
	@Output() checkboxChange = new EventEmitter<boolean>();
	@Input() checked: boolean = false;

	changeCheckbox(event: boolean) {
		this.checkboxChange.emit(event);
	}

	@HostBinding('class') get hostClasses(): string {
		return this.checked || this.completed ? 'tw-bg-[var(--color-lightgreen)]' : 'tw-bg-white';
	}
	// @HostBinding('class') get completedClass(): string {
	// 	return this.completed
	// 	  ? 'tw-bg-[var(--color-green)]'
	// 	  : 'tw-bg-white';
	//   }

	ngOnInit() {}

	showCompetencies = false;
	toggleCompetencies() {
		this.showCompetencies = !this.showCompetencies;
	}
}
