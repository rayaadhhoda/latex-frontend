from __future__ import annotations

import flet as ft
from core.settings import fetch_all
from gui.entrypoints import first_run, project_selection
from gui.editor import project_editor


def main(page: ft.Page) -> None:
    page.title = "LaTeX Chatbot"
    page.scroll = ft.ScrollMode.AUTO

    def route_change(event: ft.RouteChangeEvent) -> None:
        page.views.clear()
        page.views.append(ft.View(route='/welcome',
                                  controls=[first_run(page)]))
        page.views.append(
            ft.View(route='/select-project',
                    controls=[project_selection(page)]))
        page.views.append(
            ft.View(route='/editor', controls=[project_editor(page)]))
        page.update()

    page.on_route_change = route_change
    page.go("/welcome")


def run() -> None:
    ft.app(target=main)


if __name__ == "__main__":
    run()
