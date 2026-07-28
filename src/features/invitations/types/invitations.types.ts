export interface AcceptInvitationRequest {
  token: string
}

export interface AcceptInvitationResponse {
  /**
   * true  → a brand-new account was created; a temp password was emailed.
   * false → an existing user was added to a company.
   * The response deliberately carries NO tokens — accepting proves email
   * ownership, not password knowledge, so there's no auto-login.
   */
  isNewUser: boolean
}
