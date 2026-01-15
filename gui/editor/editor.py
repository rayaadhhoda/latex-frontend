from __future__ import annotations

import flet as ft


def project_editor(page: ft.Page) -> ft.Control:
    return ft.Container(content=ft.Column(
        spacing=12,
        horizontal_alignment=ft.CrossAxisAlignment.START,
        controls=[
            ft.Text("Project Editor", size=24, weight=ft.FontWeight.BOLD),
        ],
    ), )
