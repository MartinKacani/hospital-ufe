import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import { ReservationsApi, Reservation, Configuration } from '../../api/hospital-wl';

@Component({
  tag: 'tjmk-medbed-reservation-editor',
  styleUrl: 'tjmk-medbed-reservation-editor.css',
  shadow: true,
})
export class TjmkMedbedReservationEditor {
  @Prop() reservationId: string;
  @Prop() departmentId: string;
  @Prop() apiBase: string;

  @Event({ eventName: 'editor-closed' }) editorClosed: EventEmitter<string>;

  @State() entry: Reservation;
  @State() errorMessage: string;
  @State() isValid: boolean = false;

  private formElement: HTMLFormElement;

  async componentWillLoad() {
    await this.loadEntry();
  }

  private async loadEntry() {
    if (this.reservationId === '@new') {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 7);
      this.entry = {
        id: '@new',
        patientId: '',
        patientName: '',
        department: this.departmentId,
        reason: '',
        from: now,
        to: tomorrow,
        status: 'pending',
      };
      return;
    }
    try {
      const configuration = new Configuration({ basePath: this.apiBase });
      const api = new ReservationsApi(configuration);
      const response = await api.getReservationRaw({
        departmentId: this.departmentId,
        reservationId: this.reservationId,
      });
      if (response.raw.status < 299) {
        this.entry = await response.value();
        this.isValid = true;
      } else {
        this.errorMessage = `Nepodarilo sa načítať objednávku: ${response.raw.statusText}`;
      }
    } catch (err: any) {
      this.errorMessage = `Nepodarilo sa načítať objednávku: ${err.message || 'neznáma chyba'}`;
    }
  }

  private formatDateForInput(date: Date): string {
    if (!date) return '';
    return date.toISOString().slice(0, 16);
  }

  private handleInputEvent(ev: InputEvent): string {
    const target = ev.target as HTMLInputElement;
    this.validateForm('silent');
    return target.value;
  }

  private validateForm(mode: 'silent' | 'show-errors'): boolean {
    if (!this.formElement) return false;
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

  private async saveEntry() {
    if (!this.validateForm('show-errors')) return;

    try {
      const configuration = new Configuration({ basePath: this.apiBase });
      const api = new ReservationsApi(configuration);

      const response = this.reservationId === '@new'
        ? await api.createReservationRaw({ departmentId: this.departmentId, reservation: this.entry })
        : await api.updateReservationRaw({
            departmentId: this.departmentId,
            reservationId: this.reservationId,
            reservation: this.entry,
          });

      if (response.raw.status < 299) {
        this.editorClosed.emit('store');
      } else {
        this.errorMessage = `Nepodarilo sa uložiť objednávku: ${response.raw.statusText}`;
      }
    } catch (err: any) {
      this.errorMessage = `Nepodarilo sa uložiť objednávku: ${err.message || 'neznáma chyba'}`;
    }
  }

  private async deleteEntry() {
    try {
      const configuration = new Configuration({ basePath: this.apiBase });
      const api = new ReservationsApi(configuration);
      const response = await api.deleteReservationRaw({
        departmentId: this.departmentId,
        reservationId: this.reservationId,
      });
      if (response.raw.status < 299) {
        this.editorClosed.emit('delete');
      } else {
        this.errorMessage = `Nepodarilo sa zrušiť objednávku: ${response.raw.statusText}`;
      }
    } catch (err: any) {
      this.errorMessage = `Nepodarilo sa zrušiť objednávku: ${err.message || 'neznáma chyba'}`;
    }
  }

  render() {
    if (this.errorMessage) {
      return (
        <Host>
          <div class="error">{this.errorMessage}</div>
          <div class="actions">
            <md-outlined-button onClick={() => this.editorClosed.emit('cancel')}>
              Späť
            </md-outlined-button>
          </div>
        </Host>
      );
    }

    const isNew = this.reservationId === '@new';

    return (
      <Host>
        <div class="editor-header">
          <md-icon-button onclick={() => this.editorClosed.emit('cancel')}>
            <md-icon>arrow_back</md-icon>
          </md-icon-button>
          <span class="editor-title">
            {isNew ? 'Nová objednávka' : 'Úprava objednávky'}
          </span>
        </div>

        <form ref={el => (this.formElement = el)}>
          <md-filled-text-field
            label="Meno a priezvisko pacienta"
            required
            pattern=".*\S.*"
            value={this.entry?.patientName}
            oninput={(ev: InputEvent) => {
              if (this.entry) this.entry.patientName = this.handleInputEvent(ev);
            }}
          >
            <md-icon slot="leading-icon">person</md-icon>
          </md-filled-text-field>

          <md-filled-text-field
            label="Rodné číslo / ID pacienta"
            required
            pattern=".*\S.*"
            value={this.entry?.patientId}
            oninput={(ev: InputEvent) => {
              if (this.entry) this.entry.patientId = this.handleInputEvent(ev);
            }}
          >
            <md-icon slot="leading-icon">fingerprint</md-icon>
          </md-filled-text-field>

          <md-filled-text-field
            label="Dôvod hospitalizácie / vyšetrenia"
            required
            pattern=".*\S.*"
            value={this.entry?.reason}
            oninput={(ev: InputEvent) => {
              if (this.entry) this.entry.reason = this.handleInputEvent(ev);
            }}
          >
            <md-icon slot="leading-icon">medical_services</md-icon>
          </md-filled-text-field>

          <md-filled-text-field
            label="Dátum od"
            type="datetime-local"
            required
            value={this.formatDateForInput(this.entry?.from)}
            oninput={(ev: InputEvent) => {
              if (this.entry) {
                const val = this.handleInputEvent(ev);
                this.entry.from = new Date(val);
              }
            }}
          >
            <md-icon slot="leading-icon">calendar_today</md-icon>
          </md-filled-text-field>

          <md-filled-text-field
            label="Dátum do"
            type="datetime-local"
            required
            value={this.formatDateForInput(this.entry?.to)}
            oninput={(ev: InputEvent) => {
              if (this.entry) {
                const val = this.handleInputEvent(ev);
                this.entry.to = new Date(val);
              }
            }}
          >
            <md-icon slot="leading-icon">calendar_month</md-icon>
          </md-filled-text-field>

          <md-filled-text-field
            label="Kontakt (tel. / email)"
            value={this.entry?.contactInfo}
            oninput={(ev: InputEvent) => {
              if (this.entry) this.entry.contactInfo = this.handleInputEvent(ev);
            }}
          >
            <md-icon slot="leading-icon">phone</md-icon>
          </md-filled-text-field>

          {!isNew && (
            <md-filled-select
              label="Stav objednávky"
              value={this.entry?.status}
              oninput={(ev: InputEvent) => {
                if (this.entry) this.entry.status = this.handleInputEvent(ev) as any;
              }}
            >
              <md-icon slot="leading-icon">flag</md-icon>
              <md-select-option value="pending" selected={this.entry?.status === 'pending'}>
                <div slot="headline">Čaká na potvrdenie</div>
              </md-select-option>
              <md-select-option value="confirmed" selected={this.entry?.status === 'confirmed'}>
                <div slot="headline">Potvrdená</div>
              </md-select-option>
              <md-select-option value="cancelled" selected={this.entry?.status === 'cancelled'}>
                <div slot="headline">Zrušená</div>
              </md-select-option>
            </md-filled-select>
          )}

          {this.entry?.status === 'cancelled' && (
            <md-filled-text-field
              label="Dôvod zrušenia"
              value={this.entry?.cancelReason}
              oninput={(ev: InputEvent) => {
                if (this.entry) this.entry.cancelReason = this.handleInputEvent(ev);
              }}
            >
              <md-icon slot="leading-icon">info</md-icon>
            </md-filled-text-field>
          )}

          {!isNew && (
            <md-filled-text-field
              label="Poznámka nemocnice"
              value={this.entry?.note}
              oninput={(ev: InputEvent) => {
                if (this.entry) this.entry.note = this.handleInputEvent(ev);
              }}
            >
              <md-icon slot="leading-icon">note</md-icon>
            </md-filled-text-field>
          )}
        </form>

        <md-divider inset />

        <div class="actions">
          <md-filled-tonal-button
            id="delete"
            disabled={isNew}
            onClick={() => this.deleteEntry()}
          >
            <md-icon slot="icon">delete</md-icon>
            Zrušiť objednávku
          </md-filled-tonal-button>
          <span class="stretch-fill" />
          <md-outlined-button id="cancel" onClick={() => this.editorClosed.emit('cancel')}>
            Späť
          </md-outlined-button>
          <md-filled-button id="confirm" onClick={() => this.saveEntry()}>
            <md-icon slot="icon">save</md-icon>
            Uložiť
          </md-filled-button>
        </div>
      </Host>
    );
  }
}
