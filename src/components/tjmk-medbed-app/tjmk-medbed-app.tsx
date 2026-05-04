import { Component, Host, Prop, State, h } from '@stencil/core';
import { ReservationsApi, StaysApi, Configuration } from '../../api/hospital-wl';

@Component({
  tag: 'tjmk-medbed-app',
  styleUrl: 'tjmk-medbed-app.css',
  shadow: true,
})
export class TjmkMedbedApp {
  @State() private relativePath = '';
  @State() private pendingReservations = 0;
  @State() private activeStays = 0;
  @Prop() basePath: string = '';
  @Prop() apiBase: string;
  @Prop() departmentId: string;

  async componentWillLoad() {
    const baseUri = new URL(this.basePath, document.baseURI || '/').pathname;

    const toRelative = (path: string) => {
      if (path.startsWith(baseUri)) {
        this.relativePath = path.slice(baseUri.length);
      } else {
        this.relativePath = '';
      }
    };

    window.navigation?.addEventListener('navigate', (ev: Event) => {
      if ((ev as any).canIntercept) {
        (ev as any).intercept();
      }
      let path = new URL((ev as any).destination.url).pathname;
      toRelative(path);
    });

    toRelative(location.pathname);
    this.loadCounts();
  }

  private async loadCounts() {
    try {
      const config = new Configuration({ basePath: this.apiBase });
      const [reservations, stays] = await Promise.all([
        new ReservationsApi(config).getReservations({ departmentId: this.departmentId }),
        new StaysApi(config).getStays({ departmentId: this.departmentId }),
      ]);
      this.pendingReservations = reservations.filter(r => r.status === 'pending').length;
      this.activeStays = stays.filter(s => s.status === 'active' || s.status === 'planned').length;
    } catch { /* non-critical */ }
  }

  render() {
    console.debug('tjmk-medbed-app.render() - path: %s', this.relativePath);

    const navigate = (path: string) => {
      const absolute = new URL(path, new URL(this.basePath, document.baseURI)).pathname;
      window.navigation.navigate(absolute);
    };

    // Route: /reservations/{id} → reservation editor
    if (this.relativePath.startsWith('reservations/')) {
      const reservationId = this.relativePath.split('/')[1];
      return (
        <Host>
          <tjmk-medbed-reservation-editor
            reservation-id={reservationId}
            department-id={this.departmentId}
            api-base={this.apiBase}
            oneditor-closed={() => navigate('./list')}
          />
        </Host>
      );
    }

    // Route: /stays/{id} → stay editor
    if (this.relativePath.startsWith('stays/')) {
      const stayId = this.relativePath.split('/')[1];
      return (
        <Host>
          <tjmk-medbed-stay-editor
            stay-id={stayId}
            department-id={this.departmentId}
            api-base={this.apiBase}
            oneditor-closed={() => navigate('./list')}
          />
        </Host>
      );
    }

    // Determine which tab is active
    const activeTab = this.relativePath.startsWith('beds') ? 'beds' : 'reservations';

    return (
      <Host>
        <div class="app-container">
          <div class="app-header">
            <md-icon class="app-icon">bed</md-icon>
            <span class="app-title">MedBed</span>
          </div>
          <md-tabs
            class="app-tabs"
            onchange={(ev: CustomEvent) => {
              const idx = (ev.target as any).activeTabIndex;
              navigate(idx === 0 ? './reservations' : './beds');
            }}
          >
            <md-primary-tab
              class={activeTab === 'reservations' ? 'active-tab' : ''}
              active={activeTab === 'reservations'}
            >
              <md-icon slot="icon">event_note</md-icon>
              Objednávky
              {this.pendingReservations > 0 && <md-badge value={String(this.pendingReservations)} />}
            </md-primary-tab>
            <md-primary-tab
              class={activeTab === 'beds' ? 'active-tab' : ''}
              active={activeTab === 'beds'}
            >
              <md-icon slot="icon">bed</md-icon>
              Hospitalizácie
              {this.activeStays > 0 && <md-badge value={String(this.activeStays)} />}
            </md-primary-tab>
          </md-tabs>

          {activeTab === 'reservations' ? (
            <tjmk-medbed-reservation-list
              department-id={this.departmentId}
              api-base={this.apiBase}
              onentry-clicked={(ev: CustomEvent<string>) =>
                navigate('./reservations/' + ev.detail)
              }
            />
          ) : (
            <tjmk-medbed-stay-list
              department-id={this.departmentId}
              api-base={this.apiBase}
              onentry-clicked={(ev: CustomEvent<string>) =>
                navigate('./stays/' + ev.detail)
              }
            />
          )}
        </div>
      </Host>
    );
  }
}
