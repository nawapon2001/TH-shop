// Helper function to check if user is logged in and handle authentication
export function checkUserAuthentication(): { isAuthenticated: boolean; user: string | null } {
  if (typeof window === 'undefined') {
    return { isAuthenticated: false, user: null }
  }

  try {
    // ตรวจสอบการ login จากหลายแหล่งใน localStorage
    const user = localStorage.getItem('user')
    const userEmail = localStorage.getItem('currentUserEmail') || localStorage.getItem('userEmail')
    const sellerUser = localStorage.getItem('sellerUser')

    // ให้ priority กับ user ปกติก่อน ถ้าไม่มีค่อยใช้ seller
    const authenticatedUser = user || userEmail || sellerUser

    if (authenticatedUser) {
      return { isAuthenticated: true, user: authenticatedUser }
    }

    return { isAuthenticated: false, user: null }
  } catch (error) {
    console.error('Error checking authentication:', error)
    return { isAuthenticated: false, user: null }
  }
}

export function redirectToLogin(returnUrl?: string) {
  if (typeof window === 'undefined') return

  const currentPath = returnUrl || (window.location.pathname + window.location.search)
  window.location.href = `/login?returnUrl=${encodeURIComponent(currentPath)}`
}

export function requireAuthentication(action: string = 'ดำเนินการนี้'): boolean {
  const { isAuthenticated } = checkUserAuthentication()
  
  if (!isAuthenticated) {
    // ใช้ SweetAlert2 ถ้ามี หรือ alert ธรรมดา
    if (typeof window !== 'undefined' && (window as any).Swal) {
      (window as any).Swal.fire({
        icon: 'warning',
        title: 'กรุณาเข้าสู่ระบบ',
        text: `กรุณาเข้าสู่ระบบก่อน${action}`,
        confirmButtonText: 'เข้าสู่ระบบ',
        cancelButtonText: 'ยกเลิก',
        showCancelButton: true,
        confirmButtonColor: '#ea580c',
        cancelButtonColor: '#6b7280'
      }).then((result: any) => {
        if (result.isConfirmed) {
          redirectToLogin()
        }
      })
    } else {
      const confirmed = confirm(`กรุณาเข้าสู่ระบบก่อน${action}\n\nคลิก OK เพื่อไปหน้าเข้าสู่ระบบ`)
      if (confirmed) {
        redirectToLogin()
      }
    }
    return false
  }

  return true
}