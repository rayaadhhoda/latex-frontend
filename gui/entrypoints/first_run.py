from __future__ import annotations

import flet as ft


def first_run(page: ft.Page) -> ft.Control:
    return ft.Container(
        content=ft.Column(
            spacing=12,
            horizontal_alignment=ft.CrossAxisAlignment.START,
            controls=[
                ft.Text("Welcome to LaTeX Chatbot",
                        size=24,
                        weight=ft.FontWeight.BOLD),
                ft.Text(
                    "Finish the first-time setup to get started.",
                    size=14,
                    color=ft.Colors.GREY_700,
                ),
                ft.ElevatedButton("Get started",
                                  on_click=lambda _: page.go("/project")),
            ],
        ),
        padding=ft.padding.all(24),
    )
