import { Component, Host, Prop, State, h } from '@stencil/core';

@Component({
  tag: 'tjmk-hospital-wl-app',
  styleUrl: 'tjmk-hospital-wl-app.css',
  shadow: true,
})

export class TjmkHospitalWlApp {
  @State() private relativePath = "";
  @Prop() basePath: string="";
  @Prop() apiBase: string;
  @Prop() hospitalId: string;

  componentWillLoad() {
    const baseUri = new URL(this.basePath, document.baseURI || "/").pathname;

    const toRelative = (path: string) => {
      if (path.startsWith( baseUri)) {
        this.relativePath = path.slice(baseUri.length)
      } else {
        this.relativePath = ""
      }
    }

    window.navigation?.addEventListener("navigate", (ev: Event) => {
      if ((ev as any).canIntercept) { (ev as any).intercept(); }
      let path = new URL((ev as any).destination.url).pathname;
      toRelative(path);
    });

    toRelative(location.pathname)
  }

  render() {
    console.debug("tjmk-hospital-wl-app.render() - path: %s", this.relativePath);

    let element = "list"
    let entryId = "@new"

    if ( this.relativePath.startsWith("entry/"))
    {
      element = "editor";
      entryId = this.relativePath.split("/")[1]
    }

    const navigate = (path:string) => {
      const absolute = new URL(path, new URL(this.basePath, document.baseURI)).pathname;
      window.navigation.navigate(absolute)
    }

    return (
      <Host>
        { element === "editor"
        ? <tjmk-hospital-wl-editor entry-id={entryId}
          hospital-id={this.hospitalId} api-base={this.apiBase}
          oneditor-closed={ () => navigate("./list")}
        ></tjmk-hospital-wl-editor>
        : <tjmk-hospital-wl-list  hospital-id={this.hospitalId} api-base={this.apiBase}
          onentry-clicked={ (ev: CustomEvent<string>)=> navigate("./entry/" + ev.detail) } >
          </tjmk-hospital-wl-list>
        }
      </Host>
    );
  }
}
