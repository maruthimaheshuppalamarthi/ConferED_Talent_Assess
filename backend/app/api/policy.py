"""
Read-only platform policy for the other portals. The System Admin edits these values (see admin_settings.py);
the Candidate, Recruiter and Proctor screens read them here so the rules they enforce are always the current ones.

    GET /policy/general      public: platform name + support contact (safe to show before sign-in)
    GET /policy/proctoring   any signed-in principal (staff or verified candidate)
    GET /policy/assessment   any signed-in principal (staff or verified candidate)

Values come from the cached runtime settings, so a change made by an admin is visible within a few seconds.
"""
from fastapi import APIRouter, Depends

from app.api.deps import get_current_principal
from app.api.settings_models import OUT_MODELS
from app.core.default_settings import GROUP_ASSESSMENT, GROUP_GENERAL, GROUP_PROCTORING
from app.services import runtime_settings as rt

router = APIRouter(prefix="/policy", tags=["Platform policy (read-only)"])


@router.get("/general", response_model=OUT_MODELS[GROUP_GENERAL])
def general_policy():
    return rt.group_values(GROUP_GENERAL)


@router.get("/proctoring", response_model=OUT_MODELS[GROUP_PROCTORING])
def proctoring_policy(_: dict = Depends(get_current_principal)):
    return rt.group_values(GROUP_PROCTORING)


@router.get("/assessment", response_model=OUT_MODELS[GROUP_ASSESSMENT])
def assessment_policy(_: dict = Depends(get_current_principal)):
    return rt.group_values(GROUP_ASSESSMENT)
