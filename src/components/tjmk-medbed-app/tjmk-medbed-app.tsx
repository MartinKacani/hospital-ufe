import { Component, Host, Prop, State, h } from '@stencil/core';
import { ReservationsApi, StaysApi, DepartmentsApi, Department, Configuration } from '../../api/hospital-wl';

@Component({
  tag: 'tjmk-medbed-app',
  styleUrl: 'tjmk-medbed-app.css',
  shadow: true,
})
export class TjmkMedbedApp {
  @State() private relativePath = '';
  @State() private pendingReservations = 0;
  @State() private activeStays = 0;
  @State() private departments: Department[] = [];
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
      if ((ev as any).canIntercept) (ev as any).intercept();
      toRelative(new URL((ev as any).destination.url).pathname);
    });

    toRelative(location.pathname);
    await this.loadDepartments();
    this.loadCounts();
  }

  private async loadDepartments() {
    try {
      const depts = await new DepartmentsApi(new Configuration({ basePath: this.apiBase })).getDepartments();
      this.departments = depts.length > 0 ? depts : (this.departmentId ? [{ id: this.departmentId, name: this.departmentId }] : []);
    } catch {
      if (this.departmentId) {
        this.departments = [{ id: this.departmentId, name: this.departmentId }];
      }
    }
  }

  private async loadCounts() {
    if (!this.departments.length) return;
    try {
      const config = new Configuration({ basePath: this.apiBase });
      const results = await Promise.all(
        this.departments.map(d => Promise.all([
          new ReservationsApi(config).getReservations({ departmentId: d.id }).catch(() => []),
          new StaysApi(config).getStays({ departmentId: d.id }).catch(() => []),
        ]))
      );
      this.pendingReservations = results.flatMap(([r]) => r).filter((r: any) => r.status === 'pending').length;
      this.activeStays = results.flatMap(([, s]) => s).filter((s: any) => s.status === 'active' || s.status === 'planned').length;
    } catch { /* non-critical */ }
  }

  render() {
    const navigate = (path: string) => {
      const absolute = new URL(path, new URL(this.basePath, document.baseURI)).pathname;
      window.navigation.navigate(absolute);
    };

    // Route: reservations/@new or reservations/{deptId}/{id}
    if (this.relativePath.startsWith('reservations/')) {
      const parts = this.relativePath.split('/');
      const isNew = parts[1] === '@new';
      const departmentId = isNew ? '' : parts[1];
      const reservationId = isNew ? '@new' : parts[2];
      return (
        <Host>
          <tjmk-medbed-reservation-editor
            reservation-id={reservationId}
            department-id={departmentId}
            departments={this.departments}
            api-base={this.apiBase}
            oneditor-closed={() => { this.loadCounts(); navigate('./list'); }}
          />
        </Host>
      );
    }

    // Route: stays/@new or stays/{deptId}/{id}
    if (this.relativePath.startsWith('stays/')) {
      const parts = this.relativePath.split('/');
      const isNew = parts[1] === '@new';
      const departmentId = isNew ? '' : parts[1];
      const stayId = isNew ? '@new' : parts[2];
      return (
        <Host>
          <tjmk-medbed-stay-editor
            stay-id={stayId}
            department-id={departmentId}
            departments={this.departments}
            api-base={this.apiBase}
            oneditor-closed={() => { this.loadCounts(); navigate('./list'); }}
          />
        </Host>
      );
    }

    const activeTab = this.relativePath.startsWith('beds') ? 'beds' : 'reservations';
    const deptLabel = this.departments.length === 1
      ? (this.departments[0].name || this.departments[0].id)
      : `${this.departments.length} oddelení`;

    return (
      <Host>
        <div class="app-container">
          <div class="app-header">
            <md-icon class="app-icon">bed</md-icon>
            <span class="app-title">MedBed</span>
            <span class="app-department">{deptLabel}</span>
          </div>
          <md-tabs
            class="app-tabs"
            onchange={(ev: CustomEvent) => {
              const idx = (ev.target as any).activeTabIndex;
              navigate(idx === 0 ? './reservations' : './beds');
            }}
          >
            <md-primary-tab active={activeTab === 'reservations'}>
              <md-icon slot="icon">event_note</md-icon>
              Objednávky
              {this.pendingReservations > 0 && <md-badge value={String(this.pendingReservations)} />}
            </md-primary-tab>
            <md-primary-tab active={activeTab === 'beds'}>
              <md-icon slot="icon">bed</md-icon>
              Hospitalizácie
              {this.activeStays > 0 && <md-badge value={String(this.activeStays)} />}
            </md-primary-tab>
          </md-tabs>

          {activeTab === 'reservations' ? (
            <tjmk-medbed-reservation-list
              departments={this.departments}
              api-base={this.apiBase}
              onentry-clicked={(ev: CustomEvent<string>) => navigate('./reservations/' + ev.detail)}
            />
          ) : (
            <tjmk-medbed-stay-list
              departments={this.departments}
              api-base={this.apiBase}
              onentry-clicked={(ev: CustomEvent<string>) => navigate('./stays/' + ev.detail)}
            />
          )}
        </div>
      </Host>
    );
  }
}
