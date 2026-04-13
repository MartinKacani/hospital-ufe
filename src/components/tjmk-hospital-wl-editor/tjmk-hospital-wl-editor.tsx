import { Component, Host, Prop, State, h, EventEmitter, Event } from '@stencil/core';
import { HospitalWaitingListApi, HospitalConditionsApi, WaitingListEntry, Configuration, Condition } from '../../api/hospital-wl';

@Component({
  tag: 'tjmk-hospital-wl-editor',
  styleUrl: 'tjmk-hospital-wl-editor.css',
  shadow: true,
})
export class TjmkHospitalWlEditor {
  @Prop() entryId: string;
  @Prop() hospitalId: string;
  @Prop() apiBase: string;

  @Event({eventName: "editor-closed"}) editorClosed: EventEmitter<string>;

  @State() private duration = 15
  @State() entry: WaitingListEntry;
  @State() conditions: Condition[];
  @State() errorMessage:string;
  @State() isValid: boolean;

  private formElement: HTMLFormElement;

  async componentWillLoad() {
    this.getWaitingEntryAsync();
    this.getConditions();
  }

  private async getWaitingEntryAsync(): Promise<WaitingListEntry> {
    if(this.entryId === "@new") {
      this.isValid = false;
      this.entry = {
        id: "@new",
        patientId: "",
        waitingSince: new Date(Date.now()),
        estimatedDurationMinutes: 15
      };
      this.entry.estimatedStart = await this.assumedEntryDateAsync();
      return this.entry;
    }
    if ( !this.entryId ) {
      this.isValid = false;
      return undefined
    }
    try {
      const configuration = new Configuration({
      basePath: this.apiBase,
      });

      const waitingListApi = new HospitalWaitingListApi(configuration);

      const response = await waitingListApi.getWaitingListEntryRaw({hospitalId: this.hospitalId, entryId: this.entryId});

      if (response.raw.status < 299) {
          this.entry = await response.value();
          this.isValid = true;
      } else {
          this.errorMessage = `Cannot retrieve list of waiting patients: ${response.raw.statusText}`
      }
    } catch (err: any) {
      this.errorMessage = `Cannot retrieve list of waiting patients: ${err.message || "unknown"}`
    }
    return undefined;
  }

  private async assumedEntryDateAsync(): Promise<Date> {
    try {
      const configuration = new Configuration({
        basePath: this.apiBase,
      });

      const waitingListApi = new HospitalWaitingListApi(configuration);
      const response = await waitingListApi.getWaitingListEntriesRaw({hospitalId: this.hospitalId})
      if (response.raw.status > 299) {
        return new Date();
      }
      const lastPatientOut = (await response.value())
        .map((_: WaitingListEntry) =>
            _.estimatedStart.getTime()
            + _.estimatedDurationMinutes * 60 * 1000
        )
        .reduce((acc: number, value: number) => Math.max(acc, value), 0);
      return new Date(Math.max(Date.now(), lastPatientOut));
    } catch (err: any) {
      return new Date();
    }
  }

  private async getConditions(): Promise<Condition[]> {
    try {
      const configuration = new Configuration({
        basePath: this.apiBase,
      });

      const conditionsApi = new HospitalConditionsApi(configuration);

      const response = await conditionsApi.getConditionsRaw({hospitalId: this.hospitalId})
      if (response.raw.status < 299) {
        this.conditions = await response.value();
      }
    } catch (err: any) {
      // no strong dependency on conditions
    }
    // always have some fallback condition
    return this.conditions || [{
      code: "fallback",
      value: "Neurčený dôvod návštevy",
      typicalDurationMinutes: 15,
    }];
  }

  private handleSliderInput(event: Event) {
    this.duration = +(event.target as HTMLInputElement).value;
  }

  render() {
    if(this.errorMessage) {
      return (
      <Host>
        <div class="error">{this.errorMessage}</div>
      </Host>
      )
    }
    return (
      <Host>
        <form ref={el => this.formElement = el}>
          <md-filled-text-field label="Meno a Priezvisko"
            required pattern=".*\S.*" value={this.entry?.name}
            oninput={ (ev: InputEvent) => {
              if(this.entry) {this.entry.name = this.handleInputEvent(ev)}
            } }>
            <md-icon slot="leading-icon">person</md-icon>
          </md-filled-text-field>

          <md-filled-text-field label="Registračné číslo pacienta"
            required pattern=".*\S.*" value={this.entry?.patientId}
            oninput={ (ev: InputEvent) => {
              if(this.entry) {this.entry.patientId = this.handleInputEvent(ev)}
            } }>
            <md-icon slot="leading-icon">fingerprint</md-icon>
          </md-filled-text-field>

          <md-filled-text-field label="Čakáte od" disabled
            value={new Date(this.entry?.waitingSince || Date.now()).toLocaleTimeString()}>
            <md-icon slot="leading-icon">watch_later</md-icon>
          </md-filled-text-field>

          <md-filled-text-field disabled
            label="Predpokladaný čas vyšetrenia"
            value={new Date(this.entry?.estimatedStart || Date.now()).toLocaleTimeString()}>
            <md-icon slot="leading-icon">login</md-icon>
          </md-filled-text-field>

          {this.renderConditions()}
        </form>

        <div class="duration-slider">
          <span class="label">Predpokladaná doba trvania:&nbsp; </span>
          <span class="label">{this.duration}</span>
          <span class="label">&nbsp;minút</span>
          <md-slider
            min="2" max="45" value={this.entry?.estimatedDurationMinutes || 15} ticks labeled
            oninput={ (ev:InputEvent) => {
              if(this.entry) {
              this.entry.estimatedDurationMinutes
                  = Number.parseInt(this.handleInputEvent(ev))};
              this.handleSliderInput(ev)
            } }></md-slider>
        </div>

        <md-divider inset></md-divider>

        <div class="actions">
          <md-filled-tonal-button id="delete" disabled={!this.entry || this.entry?.id === "@new" }
            onClick={() => this.deleteEntry()} >
            <md-icon slot="icon">delete</md-icon>
            Zmazať
          </md-filled-tonal-button>
          <span class="stretch-fill"></span>
          <md-outlined-button id="cancel"
            onClick={() => this.editorClosed.emit("cancel")}>
            Zrušiť
          </md-outlined-button>
          <md-filled-button id="confirm"
            onClick={() => this.updateEntry() }
            >
            <md-icon slot="icon">save</md-icon>
            Uložiť
          </md-filled-button>
        </div>
      </Host>
    );
  }

  private renderConditions() {
    let conditions = this.conditions || [];
    // we want to have this.entry`s condition in the selection list
    if (this.entry?.condition) {
      const index = conditions.findIndex(condition => condition.code === this.entry.condition.code)
      if (index < 0) {
      conditions = [this.entry.condition, ...conditions]
      }
    }
    return (
      <md-filled-select label="Dôvod návštevy"
        display-text={this.entry?.condition?.value}
        oninput={(ev: InputEvent) => this.handleCondition(ev)} >
      <md-icon slot="leading-icon">sick</md-icon>
      {this.entry?.condition?.reference ?
        <md-icon slot="trailing-icon" class="link"
          onclick={()=> window.open(this.entry.condition.reference, "_blank")}>
            open_in_new
        </md-icon>
      : undefined
      }
      {conditions.map(condition => {
          return (
            <md-select-option
            value={condition.code}
            selected={condition.code === this.entry?.condition?.code}>
                <div slot="headline">{condition.value}</div>
            </md-select-option>
          )
      })}
      </md-filled-select>
    );
  }

  private handleCondition(ev: InputEvent) {
    if(this.entry) {
      const code = this.handleInputEvent(ev)
      const condition = this.conditions.find(condition => condition.code === code);
      this.entry.condition = Object.assign({}, condition);
      this.entry.estimatedDurationMinutes = condition.typicalDurationMinutes;
      this.duration = condition.typicalDurationMinutes;
    }
  }

  private handleInputEvent( ev: InputEvent): string {
    const target = ev.target as HTMLInputElement;
    this.validateForm('silent');
    return target.value
  }

  private validateForm(mode: 'silent' | 'show-errors'): boolean {
    // check validity of elements
    this.isValid = true;
    for (let i = 0; i < this.formElement.children.length; i++) {
      const element = this.formElement.children[i] as HTMLElement & {
        checkValidity?: () => boolean;
        reportValidity?: () => boolean;
      };

      let valid = true;
      if (mode === 'show-errors' && element.reportValidity) {
        valid = element.reportValidity();
      } else if (element.checkValidity) {
        valid = element.checkValidity();
      }
      this.isValid &&= valid;
    }
    return this.isValid;
  }

  private async updateEntry() {
    if (!this.validateForm('show-errors')) {
      return;
    }

    try {
      const configuration = new Configuration({
        basePath: this.apiBase,
      });

      const waitingListApi = new HospitalWaitingListApi(configuration);

      const response = this.entryId == "@new" ?
      await waitingListApi.createWaitingListEntryRaw({hospitalId: this.hospitalId, waitingListEntry: this.entry}) :
      await waitingListApi.updateWaitingListEntryRaw({hospitalId: this.hospitalId, entryId: this.entryId, waitingListEntry: this.entry});

      if (response.raw.status < 299) {
        this.editorClosed.emit("store")
      } else {
        this.errorMessage = `Cannot store entry: ${response.raw.statusText}`
      }
    } catch (err: any) {
      this.errorMessage = `Cannot store entry: ${err.message || "unknown"}`
    }
  }

  private async deleteEntry() {
    try {
      const configuration = new Configuration({
        basePath: this.apiBase,
      });

      const waitingListApi = new HospitalWaitingListApi(configuration);

      const response = await waitingListApi.deleteWaitingListEntryRaw({hospitalId: this.hospitalId, entryId: this.entryId});
        if (response.raw.status < 299) {
        this.editorClosed.emit("delete")
        } else {
        this.errorMessage = `Cannot delete entry: ${response.raw.statusText}`
        }
    } catch (err: any) {
        this.errorMessage = `Cannot delete entry: ${err.message || "unknown"}`
    }
  }
}
