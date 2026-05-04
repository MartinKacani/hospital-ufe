import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import { StaysApi, HospitalizationStay, ReservationsApi, Reservation, Configuration } from '../../api/hospital-wl';

@Component({
  tag: 'tjmk-medbed-stay-editor',
  styleUrl: 'tjmk-medbed-stay-editor.css',
  shadow: true,
})
export class TjmkMedbedStayEditor {
  @Prop() stayId: string;
  @Prop() departmentId: string;
  @Prop() apiBase: string;

  @Event({ eventName: 'editor-closed' }) editorClosed: EventEmitter<string>;

  @State() entry: HospitalizationStay;
  @State() reservations: Reservation[] = [];
  @State() errorMessage: string;
  @State() errors: Record<string, string> = {};
  @State() showErrors = false;
  @State() confirmDeleteOpen = false;

  async componentWillLoad() {
    await Promise.all([this.loadEntry(), this.loadReservations()]);
  }

  private async loadReservations() {
    try {
      const api = new ReservationsApi(new Configuration({ basePath: this.apiBase }));
      const response = await api.getReservationsRaw({ departmentId: this.departmentId });
      if (response.raw.status < 299) {
        const all = await response.value();
        this.reservations = all.filter(r => r.status !== 'cancelled');
      }
    } catch { /* non-critical */ }
  }

  private async loadEntry() {
    if (this.stayId === '@new') {
      const now = new Date();
      const inFive = new Date(now);
      inFive.setDate(inFive.getDate() + 5);
      this.entry = {
        id: '@new',
        patientId: '',
        patientName: '',
        department: this.departmentId,
        roomNumber: '',
        bedNumber: '',
        from: now,
        to: inFive,
        status: 'planned',
      };
      return;
    }
    try {
      const api = new StaysApi(new Configuration({ basePath: this.apiBase }));
      const response = await api.getStayRaw({ departmentId: this.departmentId, stayId: this.stayId });
      if (response.raw.status < 299) {
        this.entry = await response.value();
      } else {
        this.errorMessage = `Nepodarilo sa načítať hospitalizáciu: ${response.raw.statusText}`;
      }
    } catch (err: any) {
      this.errorMessage = `Nepodarilo sa načítať hospitalizáciu: ${err.message || 'neznáma chyba'}`;
    }
  }

  private validate(): boolean {
    const e: Record<string, string> = {};
    const rc = /^\d{6}\/?[0-9]{3,4}$/;
    const bedNum = /^[A-Za-z0-9]+$/;

    if (!this.entry?.patientName?.trim())
      e.patientName = 'Meno pacienta je povinné';

    if (!this.entry?.patientId?.trim())
      e.patientId = 'Rodné číslo je povinné';
    else if (!rc.test(this.entry.patientId.replace(/\s/g, '')))
      e.patientId = 'Rodné číslo musí byť vo formáte RRMMDD/XXXX alebo RRMMDDXXXX';

    if (!this.entry?.roomNumber?.trim())
      e.roomNumber = 'Číslo izby je povinné';

    if (!this.entry?.bedNumber?.trim())
      e.bedNumber = 'Číslo lôžka je povinné';
    else if (!bedNum.test(this.entry.bedNumber.trim()))
      e.bedNumber = 'Číslo lôžka môže obsahovať len písmená a číslice';

    if (!this.entry?.from)
      e.from = 'Dátum príjmu je povinný';

    if (!this.entry?.to)
      e.to = 'Dátum prepustenia je povinný';
    else if (this.entry.from && this.entry.to <= this.entry.from)
      e.to = 'Dátum prepustenia musí byť neskorší ako dátum príjmu';

    if ((this.entry?.status === 'cancelled' || this.entry?.status === 'completed') && !this.entry?.cancelReason?.trim())
      e.cancelReason = 'Pri ukončení alebo zrušení je dôvod povinný';

    this.errors = e;
    return Object.keys(e).length === 0;
  }

  private formatDateForInput(date: Date): string {
    if (!date) return '';
    return new Date(date).toISOString().slice(0, 16);
  }

  private fillFromReservation(reservationId: string) {
    const r = this.reservations.find(r => r.id === reservationId);
    if (r && this.entry) {
      this.entry = { ...this.entry, reservationId: r.id, patientId: r.patientId, patientName: r.patientName, from: r.from, to: r.to };
    }
  }

  private async saveEntry() {
    this.showErrors = true;
    if (!this.validate()) return;

    try {
      const api = new StaysApi(new Configuration({ basePath: this.apiBase }));
      const response = this.stayId === '@new'
        ? await api.createStayRaw({ departmentId: this.departmentId, stay: this.entry })
        : await api.updateStayRaw({ departmentId: this.departmentId, stayId: this.stayId, stay: this.entry });

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
      const api = new StaysApi(new Configuration({ basePath: this.apiBase }));
      const response = await api.deleteStayRaw({ departmentId: this.departmentId, stayId: this.stayId });
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

    const isNew = this.stayId === '@new';

    return (
      <Host>
        <div class="editor-header">
          <md-icon-button onclick={() => this.editorClosed.emit('cancel')}>
            <md-icon>arrow_back</md-icon>
          </md-icon-button>
          <span class="editor-title">{isNew ? 'Nová hospitalizácia' : 'Úprava hospitalizácie'}</span>
        </div>

        <div class="form">
          {isNew && this.reservations.length > 0 && (
            <md-filled-select
              label="Naviazať na objednávku (voliteľné)"
              oninput={(ev: InputEvent) => {
                const val = (ev.target as HTMLInputElement).value;
                if (val) this.fillFromReservation(val);
              }}
            >
              <md-icon slot="leading-icon">event_note</md-icon>
              <md-select-option value="">
                <div slot="headline">— bez objednávky —</div>
              </md-select-option>
              {this.reservations.map(r => (
                <md-select-option value={r.id} selected={this.entry?.reservationId === r.id}>
                  <div slot="headline">{r.patientName} · {new Date(r.from).toLocaleDateString('sk')}</div>
                </md-select-option>
              ))}
            </md-filled-select>
          )}

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

          <div class="bed-row">
            <md-filled-text-field
              label="Izba"
              required
              placeholder="3B"
              value={this.entry?.roomNumber}
              error={!!this.err('roomNumber')}
              error-text={this.err('roomNumber') || ''}
              supporting-text="Napr. 3B"
              oninput={(ev: InputEvent) => {
                if (this.entry) { this.entry = { ...this.entry, roomNumber: (ev.target as HTMLInputElement).value }; }
                if (this.showErrors) this.validate();
              }}
            >
              <md-icon slot="leading-icon">meeting_room</md-icon>
            </md-filled-text-field>

            <md-filled-text-field
              label="Lôžko"
              required
              placeholder="1"
              value={this.entry?.bedNumber}
              error={!!this.err('bedNumber')}
              error-text={this.err('bedNumber') || ''}
              supporting-text="Napr. 1, 2A"
              oninput={(ev: InputEvent) => {
                if (this.entry) { this.entry = { ...this.entry, bedNumber: (ev.target as HTMLInputElement).value }; }
                if (this.showErrors) this.validate();
              }}
            >
              <md-icon slot="leading-icon">bed</md-icon>
            </md-filled-text-field>
          </div>

          <md-filled-text-field
            label="Dátum príjmu"
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
            <md-icon slot="leading-icon">login</md-icon>
          </md-filled-text-field>

          <md-filled-text-field
            label="Plánovaný dátum prepustenia"
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
            <md-icon slot="leading-icon">logout</md-icon>
          </md-filled-text-field>

          {!isNew && (
            <md-filled-select
              label="Stav hospitalizácie"
              oninput={(ev: InputEvent) => {
                if (this.entry) { this.entry = { ...this.entry, status: (ev.target as HTMLInputElement).value as any }; }
                if (this.showErrors) this.validate();
              }}
            >
              <md-icon slot="leading-icon">flag</md-icon>
              <md-select-option value="planned" selected={this.entry?.status === 'planned'}>
                <div slot="headline">Plánovaná</div>
              </md-select-option>
              <md-select-option value="active" selected={this.entry?.status === 'active'}>
                <div slot="headline">Aktívna</div>
              </md-select-option>
              <md-select-option value="completed" selected={this.entry?.status === 'completed'}>
                <div slot="headline">Ukončená</div>
              </md-select-option>
              <md-select-option value="cancelled" selected={this.entry?.status === 'cancelled'}>
                <div slot="headline">Zrušená</div>
              </md-select-option>
            </md-filled-select>
          )}

          {(this.entry?.status === 'cancelled' || this.entry?.status === 'completed') && (
            <md-filled-text-field
              label="Dôvod ukončenia / zrušenia"
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

          <md-filled-text-field
            label="Klinické poznámky"
            value={this.entry?.notes}
            supporting-text="Voliteľné — diéta, alergie, špeciálne požiadavky"
            oninput={(ev: InputEvent) => {
              if (this.entry) { this.entry = { ...this.entry, notes: (ev.target as HTMLInputElement).value }; }
            }}
          >
            <md-icon slot="leading-icon">note_alt</md-icon>
          </md-filled-text-field>
        </div>

        <md-divider inset />

        <div class="actions">
          <md-filled-tonal-button disabled={isNew} onClick={() => { this.confirmDeleteOpen = true; }}>
            <md-icon slot="icon">delete</md-icon>
            Zrušiť pobyt
          </md-filled-tonal-button>
          <span class="stretch-fill" />
          <md-outlined-button onClick={() => this.editorClosed.emit('cancel')}>Späť</md-outlined-button>
          <md-filled-button onClick={() => this.saveEntry()}>
            <md-icon slot="icon">save</md-icon>
            Uložiť
          </md-filled-button>
        </div>

        <md-dialog open={this.confirmDeleteOpen} onclose={() => { this.confirmDeleteOpen = false; }}>
          <div slot="headline">Zrušiť pobyt?</div>
          <div slot="content">
            Naozaj chcete zrušiť pobyt pacienta <strong>{this.entry?.patientName}</strong>? Táto akcia sa nedá vrátiť.
          </div>
          <div slot="actions">
            <md-outlined-button onClick={() => { this.confirmDeleteOpen = false; }}>Nie, späť</md-outlined-button>
            <md-filled-tonal-button onClick={() => { this.confirmDeleteOpen = false; this.deleteEntry(); }}>
              <md-icon slot="icon">delete</md-icon>
              Áno, zrušiť
            </md-filled-tonal-button>
          </div>
        </md-dialog>
      </Host>
    );
  }
}
