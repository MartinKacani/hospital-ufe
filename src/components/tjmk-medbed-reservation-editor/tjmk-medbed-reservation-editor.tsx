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
  @State() errors: Record<string, string> = {};
  @State() showErrors = false;
  @State() confirmDeleteOpen = false;

  async componentWillLoad() {
    await this.loadEntry();
  }

  private async loadEntry() {
    if (this.reservationId === '@new') {
      const now = new Date();
      const inWeek = new Date(now);
      inWeek.setDate(inWeek.getDate() + 7);
      this.entry = {
        id: '@new',
        patientId: '',
        patientName: '',
        department: this.departmentId,
        reason: '',
        from: now,
        to: inWeek,
        status: 'pending',
      };
      return;
    }
    try {
      const api = new ReservationsApi(new Configuration({ basePath: this.apiBase }));
      const response = await api.getReservationRaw({ departmentId: this.departmentId, reservationId: this.reservationId });
      if (response.raw.status < 299) {
        this.entry = await response.value();
      } else {
        this.errorMessage = `Nepodarilo sa načítať objednávku: ${response.raw.statusText}`;
      }
    } catch (err: any) {
      this.errorMessage = `Nepodarilo sa načítať objednávku: ${err.message || 'neznáma chyba'}`;
    }
  }

  private validate(): boolean {
    const e: Record<string, string> = {};
    const rc = /^\d{6}\/?[0-9]{3,4}$/;

    if (!this.entry?.patientName?.trim())
      e.patientName = 'Meno pacienta je povinné';

    if (!this.entry?.patientId?.trim())
      e.patientId = 'Rodné číslo je povinné';
    else if (!rc.test(this.entry.patientId.replace(/\s/g, '')))
      e.patientId = 'Rodné číslo musí byť vo formáte RRMMDD/XXXX alebo RRMMDDXXXX';

    if (!this.entry?.reason?.trim())
      e.reason = 'Dôvod hospitalizácie je povinný';

    if (!this.entry?.from)
      e.from = 'Dátum od je povinný';

    if (!this.entry?.to)
      e.to = 'Dátum do je povinný';
    else if (this.entry.from && this.entry.to <= this.entry.from)
      e.to = 'Dátum do musí byť neskorší ako dátum od';

    if (this.entry?.status === 'cancelled' && !this.entry?.cancelReason?.trim())
      e.cancelReason = 'Pri zrušení je dôvod povinný';

    this.errors = e;
    return Object.keys(e).length === 0;
  }

  private formatDateForInput(date: Date): string {
    if (!date) return '';
    return new Date(date).toISOString().slice(0, 16);
  }

  private async saveEntry() {
    this.showErrors = true;
    if (!this.validate()) return;

    try {
      const api = new ReservationsApi(new Configuration({ basePath: this.apiBase }));
      const response = this.reservationId === '@new'
        ? await api.createReservationRaw({ departmentId: this.departmentId, reservation: this.entry })
        : await api.updateReservationRaw({ departmentId: this.departmentId, reservationId: this.reservationId, reservation: this.entry });

      if (response.raw.status < 299) {
        this.editorClosed.emit('store');
      } else {
        this.errorMessage = `Nepodarilo sa uložiť: ${response.raw.statusText}`;
      }
    } catch (err: any) {
      this.errorMessage = `Nepodarilo sa uložiť: ${err.message || 'neznáma chyba'}`;
    }
  }

  private async deleteEntry() {
    try {
      const api = new ReservationsApi(new Configuration({ basePath: this.apiBase }));
      const response = await api.deleteReservationRaw({ departmentId: this.departmentId, reservationId: this.reservationId });
      if (response.raw.status < 299) {
        this.editorClosed.emit('delete');
      } else {
        this.errorMessage = `Nepodarilo sa zrušiť: ${response.raw.statusText}`;
      }
    } catch (err: any) {
      this.errorMessage = `Nepodarilo sa zrušiť: ${err.message || 'neznáma chyba'}`;
    }
  }

  private err(field: string) {
    return this.showErrors && this.errors[field];
  }

  render() {
    if (this.errorMessage) {
      return (
        <Host>
          <div class="error">{this.errorMessage}</div>
          <div class="actions">
            <md-outlined-button onClick={() => this.editorClosed.emit('cancel')}>Späť</md-outlined-button>
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
          <span class="editor-title">{isNew ? 'Nová objednávka' : 'Úprava objednávky'}</span>
        </div>

        <div class="form">
          <md-filled-text-field
            label="Meno a priezvisko pacienta"
            required
            placeholder="Ján Novák"
            value={this.entry?.patientName}
            error={!!this.err('patientName')}
            error-text={this.err('patientName') || ''}
            supporting-text="Napr. Ján Novák"
            oninput={(ev: InputEvent) => {
              if (this.entry) { this.entry = { ...this.entry, patientName: (ev.target as HTMLInputElement).value }; }
              if (this.showErrors) this.validate();
            }}
          >
            <md-icon slot="leading-icon">person</md-icon>
          </md-filled-text-field>

          <md-filled-text-field
            label="Rodné číslo"
            required
            placeholder="900101/1234"
            value={this.entry?.patientId}
            error={!!this.err('patientId')}
            error-text={this.err('patientId') || ''}
            supporting-text="Formát: 900101/1234 alebo 9001011234"
            oninput={(ev: InputEvent) => {
              if (this.entry) { this.entry = { ...this.entry, patientId: (ev.target as HTMLInputElement).value }; }
              if (this.showErrors) this.validate();
            }}
          >
            <md-icon slot="leading-icon">fingerprint</md-icon>
          </md-filled-text-field>

          <md-filled-text-field
            label="Dôvod hospitalizácie / vyšetrenia"
            required
            placeholder="Napr. plánovaná operácia kolena"
            value={this.entry?.reason}
            error={!!this.err('reason')}
            error-text={this.err('reason') || ''}
            oninput={(ev: InputEvent) => {
              if (this.entry) { this.entry = { ...this.entry, reason: (ev.target as HTMLInputElement).value }; }
              if (this.showErrors) this.validate();
            }}
          >
            <md-icon slot="leading-icon">medical_services</md-icon>
          </md-filled-text-field>

          <md-filled-text-field
            label="Dátum od"
            type="datetime-local"
            required
            value={this.formatDateForInput(this.entry?.from)}
            error={!!this.err('from')}
            error-text={this.err('from') || ''}
            oninput={(ev: InputEvent) => {
              if (this.entry) { this.entry = { ...this.entry, from: new Date((ev.target as HTMLInputElement).value) }; }
              if (this.showErrors) this.validate();
            }}
          >
            <md-icon slot="leading-icon">calendar_today</md-icon>
          </md-filled-text-field>

          <md-filled-text-field
            label="Dátum do"
            type="datetime-local"
            required
            value={this.formatDateForInput(this.entry?.to)}
            error={!!this.err('to')}
            error-text={this.err('to') || ''}
            oninput={(ev: InputEvent) => {
              if (this.entry) { this.entry = { ...this.entry, to: new Date((ev.target as HTMLInputElement).value) }; }
              if (this.showErrors) this.validate();
            }}
          >
            <md-icon slot="leading-icon">calendar_month</md-icon>
          </md-filled-text-field>

          <md-filled-text-field
            label="Kontakt (tel. / email)"
            placeholder="+421 900 123 456"
            value={this.entry?.contactInfo}
            supporting-text="Voliteľné"
            oninput={(ev: InputEvent) => {
              if (this.entry) { this.entry = { ...this.entry, contactInfo: (ev.target as HTMLInputElement).value }; }
            }}
          >
            <md-icon slot="leading-icon">phone</md-icon>
          </md-filled-text-field>

          <md-filled-text-field
            label="Miestnosť / ambulancia"
            placeholder="Napr. Ambulancia 2B"
            value={this.entry?.roomOrAmbulance}
            supporting-text="Voliteľné"
            oninput={(ev: InputEvent) => {
              if (this.entry) { this.entry = { ...this.entry, roomOrAmbulance: (ev.target as HTMLInputElement).value }; }
            }}
          >
            <md-icon slot="leading-icon">meeting_room</md-icon>
          </md-filled-text-field>

          {!isNew && (
            <md-filled-select
              label="Stav objednávky"
              oninput={(ev: InputEvent) => {
                if (this.entry) { this.entry = { ...this.entry, status: (ev.target as HTMLInputElement).value as any }; }
                if (this.showErrors) this.validate();
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
              required
              value={this.entry?.cancelReason}
              error={!!this.err('cancelReason')}
              error-text={this.err('cancelReason') || ''}
              oninput={(ev: InputEvent) => {
                if (this.entry) { this.entry = { ...this.entry, cancelReason: (ev.target as HTMLInputElement).value }; }
                if (this.showErrors) this.validate();
              }}
            >
              <md-icon slot="leading-icon">info</md-icon>
            </md-filled-text-field>
          )}

          {!isNew && (
            <md-filled-text-field
              label="Poznámka nemocnice"
              value={this.entry?.note}
              supporting-text="Voliteľné"
              oninput={(ev: InputEvent) => {
                if (this.entry) { this.entry = { ...this.entry, note: (ev.target as HTMLInputElement).value }; }
              }}
            >
              <md-icon slot="leading-icon">note</md-icon>
            </md-filled-text-field>
          )}
        </div>

        <md-divider inset />

        <div class="actions">
          <md-filled-tonal-button disabled={isNew} onClick={() => { this.confirmDeleteOpen = true; }}>
            <md-icon slot="icon">delete</md-icon>
            Odstrániť objednávku
          </md-filled-tonal-button>
          <span class="stretch-fill" />
          <md-outlined-button onClick={() => this.editorClosed.emit('cancel')}>Späť</md-outlined-button>
          <md-filled-button onClick={() => this.saveEntry()}>
            <md-icon slot="icon">save</md-icon>
            Uložiť
          </md-filled-button>
        </div>

        <md-dialog open={this.confirmDeleteOpen} onclose={() => { this.confirmDeleteOpen = false; }}>
          <div slot="headline">Odstrániť objednávku?</div>
          <div slot="content">
            Naozaj chcete odstrániť objednávku pacienta <strong>{this.entry?.patientName}</strong>? Táto akcia sa nedá vrátiť.
          </div>
          <div slot="actions">
            <md-outlined-button onClick={() => { this.confirmDeleteOpen = false; }}>Nie, späť</md-outlined-button>
            <md-filled-tonal-button onClick={() => { this.confirmDeleteOpen = false; this.deleteEntry(); }}>
              <md-icon slot="icon">delete</md-icon>
              Áno, odstrániť
            </md-filled-tonal-button>
          </div>
        </md-dialog>
      </Host>
    );
  }
}
