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
  @State() isValid: boolean = false;

  private formElement: HTMLFormElement;

  async componentWillLoad() {
    await Promise.all([this.loadEntry(), this.loadReservations()]);
  }

  private async loadReservations() {
    try {
      const configuration = new Configuration({ basePath: this.apiBase });
      const api = new ReservationsApi(configuration);
      const response = await api.getReservationsRaw({ departmentId: this.departmentId });
      if (response.raw.status < 299) {
        const all = await response.value();
        this.reservations = all.filter(r => r.status !== 'cancelled');
      }
    } catch {
      // optional - non-critical
    }
  }

  private async loadEntry() {
    if (this.stayId === '@new') {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 5);
      this.entry = {
        id: '@new',
        patientId: '',
        patientName: '',
        department: this.departmentId,
        roomNumber: '',
        bedNumber: '',
        from: now,
        to: tomorrow,
        status: 'planned',
      };
      return;
    }
    try {
      const configuration = new Configuration({ basePath: this.apiBase });
      const api = new StaysApi(configuration);
      const response = await api.getStayRaw({
        departmentId: this.departmentId,
        stayId: this.stayId,
      });
      if (response.raw.status < 299) {
        this.entry = await response.value();
        this.isValid = true;
      } else {
        this.errorMessage = `Nepodarilo sa načítať hospitalizáciu: ${response.raw.statusText}`;
      }
    } catch (err: any) {
      this.errorMessage = `Nepodarilo sa načítať hospitalizáciu: ${err.message || 'neznáma chyba'}`;
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

  private fillFromReservation(reservationId: string) {
    const reservation = this.reservations.find(r => r.id === reservationId);
    if (reservation && this.entry) {
      this.entry = {
        ...this.entry,
        reservationId: reservation.id,
        patientId: reservation.patientId,
        patientName: reservation.patientName,
        from: reservation.from,
        to: reservation.to,
      };
    }
  }

  private async saveEntry() {
    if (!this.validateForm('show-errors')) return;

    try {
      const configuration = new Configuration({ basePath: this.apiBase });
      const api = new StaysApi(configuration);

      const response = this.stayId === '@new'
        ? await api.createStayRaw({ departmentId: this.departmentId, stay: this.entry })
        : await api.updateStayRaw({
            departmentId: this.departmentId,
            stayId: this.stayId,
            stay: this.entry,
          });

      if (response.raw.status < 299) {
        this.editorClosed.emit('store');
      } else {
        this.errorMessage = `Nepodarilo sa uložiť hospitalizáciu: ${response.raw.statusText}`;
      }
    } catch (err: any) {
      this.errorMessage = `Nepodarilo sa uložiť hospitalizáciu: ${err.message || 'neznáma chyba'}`;
    }
  }

  private async deleteEntry() {
    try {
      const configuration = new Configuration({ basePath: this.apiBase });
      const api = new StaysApi(configuration);
      const response = await api.deleteStayRaw({
        departmentId: this.departmentId,
        stayId: this.stayId,
      });
      if (response.raw.status < 299) {
        this.editorClosed.emit('delete');
      } else {
        this.errorMessage = `Nepodarilo sa zrušiť hospitalizáciu: ${response.raw.statusText}`;
      }
    } catch (err: any) {
      this.errorMessage = `Nepodarilo sa zrušiť hospitalizáciu: ${err.message || 'neznáma chyba'}`;
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

    const isNew = this.stayId === '@new';

    return (
      <Host>
        <div class="editor-header">
          <md-icon-button onclick={() => this.editorClosed.emit('cancel')}>
            <md-icon>arrow_back</md-icon>
          </md-icon-button>
          <span class="editor-title">
            {isNew ? 'Nová hospitalizácia' : 'Úprava hospitalizácie'}
          </span>
        </div>

        <form ref={el => (this.formElement = el)}>
          {isNew && this.reservations.length > 0 && (
            <md-filled-select
              label="Naviazať na objednávku (voliteľné)"
              oninput={(ev: InputEvent) => {
                const val = this.handleInputEvent(ev);
                if (val) this.fillFromReservation(val);
              }}
            >
              <md-icon slot="leading-icon">event_note</md-icon>
              <md-select-option value="">
                <div slot="headline">— bez objednávky —</div>
              </md-select-option>
              {this.reservations.map(r => (
                <md-select-option
                  value={r.id}
                  selected={this.entry?.reservationId === r.id}
                >
                  <div slot="headline">{r.patientName} · {r.from.toLocaleDateString('sk')}</div>
                </md-select-option>
              ))}
            </md-filled-select>
          )}

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

          <div class="bed-row">
            <md-filled-text-field
              label="Izba"
              required
              pattern=".*\S.*"
              value={this.entry?.roomNumber}
              oninput={(ev: InputEvent) => {
                if (this.entry) this.entry.roomNumber = this.handleInputEvent(ev);
              }}
            >
              <md-icon slot="leading-icon">meeting_room</md-icon>
            </md-filled-text-field>

            <md-filled-text-field
              label="Lôžko"
              required
              pattern=".*\S.*"
              value={this.entry?.bedNumber}
              oninput={(ev: InputEvent) => {
                if (this.entry) this.entry.bedNumber = this.handleInputEvent(ev);
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
            oninput={(ev: InputEvent) => {
              if (this.entry) {
                this.entry.from = new Date(this.handleInputEvent(ev));
              }
            }}
          >
            <md-icon slot="leading-icon">login</md-icon>
          </md-filled-text-field>

          <md-filled-text-field
            label="Plánovaný dátum prepustenia"
            type="datetime-local"
            required
            value={this.formatDateForInput(this.entry?.to)}
            oninput={(ev: InputEvent) => {
              if (this.entry) {
                this.entry.to = new Date(this.handleInputEvent(ev));
              }
            }}
          >
            <md-icon slot="leading-icon">logout</md-icon>
          </md-filled-text-field>

          {!isNew && (
            <md-filled-select
              label="Stav hospitalizácie"
              oninput={(ev: InputEvent) => {
                if (this.entry) this.entry.status = this.handleInputEvent(ev) as any;
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
              value={this.entry?.cancelReason}
              oninput={(ev: InputEvent) => {
                if (this.entry) this.entry.cancelReason = this.handleInputEvent(ev);
              }}
            >
              <md-icon slot="leading-icon">info</md-icon>
            </md-filled-text-field>
          )}

          <md-filled-text-field
            label="Klinické poznámky"
            value={this.entry?.notes}
            oninput={(ev: InputEvent) => {
              if (this.entry) this.entry.notes = this.handleInputEvent(ev);
            }}
          >
            <md-icon slot="leading-icon">note_alt</md-icon>
          </md-filled-text-field>
        </form>

        <md-divider inset />

        <div class="actions">
          <md-filled-tonal-button
            id="delete"
            disabled={isNew}
            onClick={() => this.deleteEntry()}
          >
            <md-icon slot="icon">delete</md-icon>
            Zrušiť pobyt
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
