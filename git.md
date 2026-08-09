# Git Branch Setup — Looping Prompt

Inspect repo. Do not write app code. Only create/verify branches below.

## Branches (create in order, each from `develop` unless noted)

```
main
develop
feature/project-setup
feature/authentication
feature/user-profile-settings
feature/dashboard
feature/product-catalog
feature/wallet
feature/wallet-topup
feature/admin-topup-management
feature/orders
feature/number-inventory
feature/active-numbers
feature/vendor-integration
feature/otp-fetching
feature/otp-history
feature/refunds
feature/notifications
feature/announcements
feature/admin-dashboard
feature/admin-user-management
feature/admin-product-management
feature/admin-order-management
feature/admin-settings
feature/security
feature/testing
feature/deployment
```

## Loop Logic

For each branch in the list:

1. If branch exists locally or remotely → skip, mark "Already existed"
2. Else:

   ```bash
   git checkout developgit pull origin developgit checkout -b <branch>git push -u origin <branch>
   ```

   Mark "Created"
3. If push/create fails → mark "Failed" with exact error

Exception: `develop` is created from `main`:

```bash
git checkout main
git pull origin main
git checkout -b develop
git push -u origin develop
```

## Rules

* Never merge feature → `main` directly
* One feature per branch, no mixed changes
* Lowercase, hyphenated branch names
* No app code, no comments, no extra docs during this task
* Don't recreate existing branches
* Don't force-push shared branches

## Output Format (only this, nothing else)

```
Created:
- ...

Already existed:
- ...

Failed:
- <branch>: <exact reason>

Current branch:
- <name>
```
