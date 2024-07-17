import { Component, EventEmitter, forwardRef, computed, input, Input, Output } from '@angular/core';
import { HlmCheckboxComponent } from './spartan/ui-checkbox-helm/src';
import { HlmPDirective } from './spartan/ui-typography-helm/src/lib/hlm-p.directive';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import type { ClassValue } from 'clsx';
import { hlm } from '@spartan-ng/ui-core';


@Component({
	selector: 'oeb-checkbox',
	standalone: true,
	imports: [HlmPDirective, HlmCheckboxComponent],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: forwardRef(() => OebCheckboxComponent),
			multi: true,
		},
	],
	template: ` <label class="tw-flex tw-items-center" hlmP>
		<hlm-checkbox [name]="name" (changed)="onChange($event)" class="tw-mr-2" />
		{{ text }}
	</label>`,
	host: {
		'[class]': '_computedClass()',
	},
})
export class OebCheckboxComponent implements ControlValueAccessor {
	@Input() text: string;
	@Input() control: FormControl;
	@Input() name: string;
	@Output() checkedChange = new EventEmitter<boolean>();
	@Input() ngModel: boolean;
	@Input() value: string;

	@Output() ngModelChange = new EventEmitter<string>();

	onChange(event) {
		this.ngModelChange.emit(event);
	}


	public readonly userClass = input<ClassValue>('', { alias: 'class' });
	protected _computedClass = computed(() => hlm(this.userClass()));
	private _checked = false;

	get checked() {
		return this._checked;
	}

	set checked(value: boolean) {
		this._checked = value;
		this.checkedChange.emit(this._checked);
		this.onChange(this._checked);
		this.onTouched();
	}

	onTouched = () => {};

	writeValue(value: boolean): void {
		this.checked = value;
	}

	registerOnChange(fn: any): void {
		this.onChange = fn;
	}

	registerOnTouched(fn: any): void {
		this.onTouched = fn;
	}

	setDisabledState?(isDisabled: boolean): void {
	}
}
