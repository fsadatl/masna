import argparse
from typing import List, Tuple

from sqlalchemy import func

from database import SessionLocal, Project, Idea, ProjectStatus, IdeaStatus


def find_idea_duplicates(session) -> List[int]:
    """Return idea_ids that have more than one project."""
    rows: List[Tuple[int]] = (
        session.query(Project.idea_id)
        .filter(Project.idea_id.isnot(None))
        .group_by(Project.idea_id)
        .having(func.count(Project.id) > 1)
        .all()
    )
    return [r[0] for r in rows]


def cleanup_duplicates(session, delete: bool = False, keep: str = "latest", dry_run: bool = False, reset_idea_status: bool = False) -> int:
    """
    Clean up duplicate projects created for the same idea.

    - delete=False (default): mark duplicates as cancelled (soft cleanup)
    - delete=True: permanently delete duplicate rows
    - keep="latest" (default) or "oldest": which project to keep per idea_id
    - dry_run=True: only report actions, do not modify data
    - reset_idea_status: if after deletion/cancel there is no project for an idea, set idea.status back to under_review
    Returns: number of modified/deleted rows (estimated).
    """
    modified = 0
    idea_ids = find_idea_duplicates(session)
    if not idea_ids:
        print("No duplicate projects found by idea_id.")
        return 0

    print(f"Found {len(idea_ids)} ideas with duplicate projects: {idea_ids}")

    for idea_id in idea_ids:
        order = [Project.created_at.desc(), Project.id.desc()] if keep == "latest" else [Project.created_at.asc(), Project.id.asc()]
        projects: List[Project] = (
            session.query(Project)
            .filter(Project.idea_id == idea_id)
            .order_by(*order)
            .all()
        )
        if len(projects) <= 1:
            continue

        keep_project = projects[0]
        dups = projects[1:]
        print(f"Idea {idea_id}: keeping project id={keep_project.id}, cleaning {len(dups)} duplicates -> {[p.id for p in dups]}")

        for p in dups:
            if delete:
                print(f" - DELETE project id={p.id}")
                if not dry_run:
                    session.delete(p)
                    modified += 1
            else:
                if p.status != ProjectStatus.CANCELLED:
                    print(f" - CANCEL project id={p.id}")
                    if not dry_run:
                        p.status = ProjectStatus.CANCELLED
                        modified += 1

        if reset_idea_status and not dry_run:
            # Check remaining active projects for this idea
            remaining = (
                session.query(Project)
                .filter(Project.idea_id == idea_id, Project.status != ProjectStatus.CANCELLED)
                .count()
            )
            if remaining == 0:
                idea: Idea = session.query(Idea).filter(Idea.id == idea_id).first()
                if idea and idea.status != IdeaStatus.UNDER_REVIEW:
                    print(f" - RESET idea {idea_id} status -> under_review")
                    idea.status = IdeaStatus.UNDER_REVIEW

    if dry_run:
        print("Dry-run complete. No changes committed.")
        session.rollback()
    else:
        session.commit()
        print(f"Cleanup complete. Modified rows: {modified}")

    return modified


def main():
    parser = argparse.ArgumentParser(description="Cleanup duplicate projects in DB")
    parser.add_argument("--delete", action="store_true", help="Permanently delete duplicates instead of cancelling")
    parser.add_argument("--keep", choices=["latest", "oldest"], default="latest", help="Which project to keep per idea_id")
    parser.add_argument("--dry-run", action="store_true", help="Only report actions, do not modify DB")
    parser.add_argument("--reset-idea-status", action="store_true", help="If an idea ends up with no active projects, set its status back to under_review")
    args = parser.parse_args()

    session = SessionLocal()
    try:
        cleanup_duplicates(
            session,
            delete=args.delete,
            keep=args.keep,
            dry_run=args.dry_run,
            reset_idea_status=args.reset_idea_status,
        )
    finally:
        session.close()


if __name__ == "__main__":
    main()

